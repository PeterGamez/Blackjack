import { GameType } from "./GameType";

export interface GameState {
    gameId: number;
    userId: number;
    gameType: GameType;
    status: "betting" | "playing" | "dealer-turn" | "game-over";
    playerBet: number;
    playerHand: string;
    dealerHand: string;
    playerValue: number;
    dealerValue: number;
    result: "win" | "lose" | "push" | "pending";
    reward: number;
    deck: string;
    createdAt: number;
}
