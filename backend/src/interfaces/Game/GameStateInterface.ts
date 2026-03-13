import type { GameCurrency, GameType } from "./GameType";

export interface GameStateInterface {
    gameId: number;
    userId: number;
    gameType: GameType;
    currency: GameCurrency;
    status: "betting" | "playing" | "dealer-turn" | "game-over";
    playerBet: number;
    playerHand: string;
    dealerHand: string;
    playerValue: number;
    dealerValue: number;
    result: "win" | "lose" | "draw" | "pending";
    reward: number;
    deck: string;
    createdAt: number;
}
