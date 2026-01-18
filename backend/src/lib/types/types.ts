/**
 * Core Types for IRL Quests Multiplayer System
 */

// ============================================================================
// Player & Lobby Types
// ============================================================================

export interface Player {
    id: string;          // Socket ID
    name: string;        // Display name
    isHost: boolean;
    isReady: boolean;
}

export interface Lobby {
    code: string;        // 4-char join code
    players: Map<string, Player>;
    hostId: string;
    status: 'waiting' | 'starting' | 'in-game';
    maxPlayers: number;
    createdAt: number;
}

// ============================================================================
// Game Types
// ============================================================================

export interface PlayerGameState {
    id: string;
    name: string;
    score: number;
    hasSubmitted: boolean;
    photoPath?: string;
}

export interface GameState {
    lobbyCode: string;
    players: Map<string, PlayerGameState>;
    currentRound: number;
    totalRounds: number;
    currentRiddle: string;
    roundDeadline: number;     // Unix timestamp (ms)
    status: 'riddle' | 'judging' | 'results' | 'finished';
}

// ============================================================================
// Socket Event Payloads
// ============================================================================

// Lobby events
export interface CreateLobbyPayload {
    name: string;
}

export interface JoinLobbyPayload {
    code: string;
    name: string;
}

export interface ReadyPayload {
    ready: boolean;
}

// Game events
export interface SubmitPhotoPayload {
    photoPath: string;
}

// Lobby state broadcast
export interface LobbyStatePayload {
    code: string;
    players: Array<{
        id: string;
        name: string;
        isHost: boolean;
        isReady: boolean;
    }>;
    hostId: string;
    status: 'waiting' | 'starting' | 'in-game';
    allReady: boolean;
}

// Game state broadcasts
export interface RiddlePayload {
    round: number;
    totalRounds: number;
    riddle: string;
    deadline: number;
    remainingSeconds: number;
}

export interface TickPayload {
    remainingSeconds: number;
}

export interface PlayerSubmittedPayload {
    playerId: string;
    playerName: string;
}

export interface RoundResultsPayload {
    round: number;
    grandWinner: {
        playerId: string;
        playerName: string;
        announcement: string;
    };
    trollWinner: {
        playerId: string;
        playerName: string;
        announcement: string;
    };
    scoreboard: Array<{
        rank: number;
        playerId: string;
        playerName: string;
        score: number;
        roundScore: number;
    }>;
}

export interface FinalResultsPayload {
    standings: Array<{
        rank: number;
        playerId: string;
        playerName: string;
        totalScore: number;
    }>;
}
