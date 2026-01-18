/**
 * GameManager - In-memory game state management
 */

import type {
    GameState,
    PlayerGameState,
    RiddlePayload,
    RoundResultsPayload,
    FinalResultsPayload
} from '../lib/types/types.js';
import type { Lobby } from '../lib/types/types.js';
import { judgeService, type PlayerSubmission, type RoundResult } from './judge.service.js';
import * as fs from 'fs';

// ============================================================================
// Riddles Pool (for demo purposes)
// ============================================================================

const RIDDLES = [
    "Find me something that holds memories but has no brain",
    "Capture a guardian that never sleeps but never moves",
    "Show me a bridge between two worlds",
    "Find something older than you that's still working hard",
    "Catch a tiny sun that lives indoors",
    "Show me nature's artwork on something man-made",
    "Find a number that tells a story",
    "Capture something that was once alive but now decorates",
    "Show me a reflection of something that isn't there",
    "Find a container of possibilities",
];

// ============================================================================
// Game Manager Class
// ============================================================================

export class GameManager {
    private games: Map<string, GameState> = new Map();
    private roundTimers: Map<string, NodeJS.Timeout> = new Map();
    private tickIntervals: Map<string, NodeJS.Timeout> = new Map();

    // Callbacks for socket events
    private onTick: ((lobbyCode: string, remainingSeconds: number) => void) | undefined = undefined;
    private onRoundEnd: ((lobbyCode: string) => void) | undefined = undefined;

    /**
     * Register event callbacks
     */
    setCallbacks(callbacks: {
        onTick?: (lobbyCode: string, remainingSeconds: number) => void;
        onRoundEnd?: (lobbyCode: string) => void;
    }) {
        this.onTick = callbacks.onTick;
        this.onRoundEnd = callbacks.onRoundEnd;
    }

    /**
     * Initialize a new game from a lobby
     */
    startGame(lobby: Lobby, totalRounds: number = 3): GameState { // TODO: gameconfig
        const players = new Map<string, PlayerGameState>();

        for (const [id, player] of lobby.players) {
            players.set(id, {
                id,
                name: player.name,
                score: 0,
                hasSubmitted: false,
            });
        }

        const riddle = this.getRandomRiddle();
        const deadline = Date.now() + 60000; // 60 seconds // TODO: gameconfig

        const game: GameState = {
            lobbyCode: lobby.code,
            players,
            currentRound: 1,
            totalRounds,
            currentRiddle: riddle,
            roundDeadline: deadline,
            status: 'riddle',
        };

        this.games.set(lobby.code, game);
        this.startRoundTimer(lobby.code);

        return game;
    }

    /**
     * Get a random riddle
     */
    private getRandomRiddle(): string {
        return RIDDLES[Math.floor(Math.random() * RIDDLES.length)] ?? RIDDLES[0] ?? "Find something interesting";
    }

    /**
     * Start the round timer
     */
    private startRoundTimer(lobbyCode: string) {
        // Clear any existing timers
        this.clearTimers(lobbyCode);

        const game = this.games.get(lobbyCode);
        if (!game) return;

        // Tick every second
        const tickInterval = setInterval(() => {
            const currentGame = this.games.get(lobbyCode);
            if (!currentGame || currentGame.status !== 'riddle') {
                this.clearTimers(lobbyCode);
                return;
            }

            const remaining = Math.max(0, Math.ceil((currentGame.roundDeadline - Date.now()) / 1000));

            if (this.onTick) {
                this.onTick(lobbyCode, remaining);
            }

            if (remaining <= 0) {
                this.clearTimers(lobbyCode);
                if (this.onRoundEnd) {
                    this.onRoundEnd(lobbyCode);
                }
            }
        }, 1000);

        this.tickIntervals.set(lobbyCode, tickInterval);
    }

    /**
     * Clear timers for a game
     */
    private clearTimers(lobbyCode: string) {
        const timer = this.roundTimers.get(lobbyCode);
        if (timer) {
            clearTimeout(timer);
            this.roundTimers.delete(lobbyCode);
        }

        const interval = this.tickIntervals.get(lobbyCode);
        if (interval) {
            clearInterval(interval);
            this.tickIntervals.delete(lobbyCode);
        }
    }

    /**
     * Submit a photo for the current round
     */
    submitPhoto(lobbyCode: string, playerId: string, photoPath: string): boolean {
        const game = this.games.get(lobbyCode);
        if (!game || game.status !== 'riddle') {
            return false;
        }

        const player = game.players.get(playerId);
        if (!player || player.hasSubmitted) {
            return false;
        }

        // Check if deadline passed
        if (Date.now() > game.roundDeadline) {
            return false;
        }

        player.hasSubmitted = true;
        player.photoPath = photoPath;

        // Check if all players have submitted
        if (this.allPlayersSubmitted(lobbyCode)) {
            this.clearTimers(lobbyCode);
            if (this.onRoundEnd) {
                this.onRoundEnd(lobbyCode);
            }
        }

        return true;
    }

    /**
     * Check if all players have submitted
     */
    allPlayersSubmitted(lobbyCode: string): boolean {
        const game = this.games.get(lobbyCode);
        if (!game) return false;

        for (const player of game.players.values()) {
            if (!player.hasSubmitted) {
                return false;
            }
        }
        return true;
    }

    /**
     * Judge the current round
     */
    async judgeRound(lobbyCode: string): Promise<RoundResult | null> {
        const game = this.games.get(lobbyCode);
        if (!game) return null;

        game.status = 'judging';

        // Collect submissions
        const submissions: PlayerSubmission[] = [];

        for (const player of game.players.values()) {
            if (player.photoPath) {
                try {
                    // Read image and convert to base64
                    const imageBuffer = fs.readFileSync(player.photoPath);
                    const base64 = imageBuffer.toString('base64');

                    submissions.push({
                        player_id: player.id,
                        image_base64: base64,
                    });
                } catch (err) {
                    console.error(`Failed to read image for player ${player.id}:`, err);
                }
            }
        }

        if (submissions.length === 0) {
            // No valid submissions, skip judging
            game.status = 'results';
            return null;
        }

        try {
            const result = await judgeService.judgeRound(game.currentRiddle, submissions);

            // Update scores based on judgment
            for (const entry of result.judgment.scoreboard) {
                const player = game.players.get(entry.player_id);
                if (player) {
                    player.score += entry.score;
                }
            }

            game.status = 'results';
            return result;
        } catch (err) {
            console.error('Judge service error:', err);
            game.status = 'results';
            return null;
        }
    }

    /**
     * Advance to the next round
     */
    nextRound(lobbyCode: string): GameState | null {
        const game = this.games.get(lobbyCode);
        if (!game) return null;

        if (game.currentRound >= game.totalRounds) {
            game.status = 'finished';
            return game;
        }

        // Reset player states
        for (const player of game.players.values()) {
            player.hasSubmitted = false;
            if ('photoPath' in player) {
                delete (player as { photoPath?: string }).photoPath;
            }
        }

        game.currentRound++;
        game.currentRiddle = this.getRandomRiddle();
        game.roundDeadline = Date.now() + 60000;
        game.status = 'riddle';

        this.startRoundTimer(lobbyCode);

        return game;
    }

    /**
     * Get current game state
     */
    getGame(lobbyCode: string): GameState | undefined {
        return this.games.get(lobbyCode);
    }

    /**
     * Get riddle payload for broadcast
     */
    getRiddlePayload(game: GameState): RiddlePayload {
        return {
            round: game.currentRound,
            totalRounds: game.totalRounds,
            riddle: game.currentRiddle,
            deadline: game.roundDeadline,
            remainingSeconds: Math.max(0, Math.ceil((game.roundDeadline - Date.now()) / 1000)),
        };
    }

    /**
     * Get round results payload for broadcast
     */
    getRoundResultsPayload(game: GameState, result: RoundResult): RoundResultsPayload {
        const scoreboard = result.judgment.scoreboard.map((entry, index) => {
            const player = game.players.get(entry.player_id);
            return {
                rank: entry.rank,
                playerId: entry.player_id,
                playerName: player?.name ?? 'Unknown',
                score: player?.score ?? 0,
                roundScore: entry.score,
            };
        });

        const grandWinnerPlayer = game.players.get(result.judgment.grand_winner_id);
        const trollWinnerPlayer = game.players.get(result.judgment.troll_winner_id);

        return {
            round: game.currentRound,
            grandWinner: {
                playerId: result.judgment.grand_winner_id,
                playerName: grandWinnerPlayer?.name ?? 'Unknown',
                announcement: result.grand_winner_announcement,
            },
            trollWinner: {
                playerId: result.judgment.troll_winner_id,
                playerName: trollWinnerPlayer?.name ?? 'Unknown',
                announcement: result.troll_winner_announcement,
            },
            scoreboard,
        };
    }

    /**
     * Get final results payload
     */
    getFinalResultsPayload(game: GameState): FinalResultsPayload {
        const standings = Array.from(game.players.values())
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                rank: index + 1,
                playerId: player.id,
                playerName: player.name,
                totalScore: player.score,
            }));

        return { standings };
    }

    /**
     * Clean up a game
     */
    endGame(lobbyCode: string): void {
        this.clearTimers(lobbyCode);
        this.games.delete(lobbyCode);
    }

    /**
     * Handle player disconnect
     */
    handleDisconnect(lobbyCode: string, playerId: string): void {
        const game = this.games.get(lobbyCode);
        if (!game) return;

        // Mark player as having submitted (empty) so they don't block the round
        const player = game.players.get(playerId);
        if (player && !player.hasSubmitted) {
            player.hasSubmitted = true;
        }

        // Check if all remaining connected players have submitted
        if (this.allPlayersSubmitted(lobbyCode) && game.status === 'riddle') {
            this.clearTimers(lobbyCode);
            if (this.onRoundEnd) {
                this.onRoundEnd(lobbyCode);
            }
        }
    }
}

// Export singleton instance
export const gameManager = new GameManager();
