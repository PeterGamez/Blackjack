export interface GameActionPayload {
    gameId: number;
    userId: number;
    forcedCard?: {
        suit: string;
        rank: string;
    };
}
