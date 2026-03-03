import { GameType } from "./GameType";

export interface GameStartPayload {
    userId: number;
    gameType: GameType;
    bet: number;
}
