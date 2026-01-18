/**
 * GameManager - Story-based game state management
 */
import type { GameState, RoundResultData, RoundPayload, RoundResultPayload, GameCompletePayload, FinalAwardsPayload, GameStartPayload } from '../lib/types/types.js';
import type { Lobby } from '../lib/types/types.js';
export declare class GameManager {
    private games;
    private roundTimers;
    private tickIntervals;
    private onTick;
    private onRoundEnd;
    /**
     * Register event callbacks
     */
    setCallbacks(callbacks: {
        onTick?: (lobbyCode: string, remainingSeconds: number) => void;
        onRoundEnd?: (lobbyCode: string) => void;
    }): void;
    /**
     * Initialize a new game from a lobby
     */
    startGame(lobby: Lobby): Promise<GameState>;
    /**
     * Get the current round's blank
     */
    getCurrentBlank(game: GameState): import("../lib/types/types.js").StoryBlank | undefined;
    /**
     * Start the round timer
     */
    private startRoundTimer;
    /**
     * Clear timers for a game
     */
    private clearTimers;
    /**
     * Submit a photo for the current round
     */
    submitPhoto(lobbyCode: string, playerId: string, photoPath: string): boolean;
    /**
     * Check if all players have submitted
     */
    allPlayersSubmitted(lobbyCode: string): boolean;
    /**
     * Judge the current round - picks ONE winner
     */
    judgeRound(lobbyCode: string): Promise<RoundResultData | null>;
    /**
     * Advance to the next round or complete the game
     */
    nextRound(lobbyCode: string): GameState | null;
    /**
     * Get current game state
     */
    getGame(lobbyCode: string): GameState | undefined;
    /**
     * Get game start payload
     */
    getGameStartPayload(game: GameState): GameStartPayload;
    /**
     * Get round payload for broadcast
     */
    getRoundPayload(game: GameState): RoundPayload;
    /**
     * Get round result payload for broadcast
     */
    getRoundResultPayload(result: RoundResultData, round: number): RoundResultPayload;
    /**
     * Get game complete payload with AI-generated recap
     * @param trollName - Name of the "Most Clueless" player to feature in the story
     */
    getGameCompletePayload(game: GameState, trollName: string): Promise<GameCompletePayload>;
    /**
     * Calculate and get final awards
     */
    getFinalAwardsPayload(game: GameState): FinalAwardsPayload;
    /**
     * Clean up a game
     */
    endGame(lobbyCode: string): void;
    /**
     * Handle player disconnect
     */
    handleDisconnect(lobbyCode: string, playerId: string): void;
}
export declare const gameManager: GameManager;
//# sourceMappingURL=game.manager.d.ts.map