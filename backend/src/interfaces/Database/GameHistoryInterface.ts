import type { GameType } from "../Game";
import type { InterfaceBase } from "./InterfaceBase";

export interface GameHistoryInterface extends InterfaceBase {
    playerId: number;
    dealerId: number;
    mode: GameType;
    bet: number;
    playerScore: number;
    dealerScore: number;
    // ยึดผลจากมุม player
    result: "win" | "lose" | "draw" | "blackjack";
    playerPayout: number;
    dealerPayout: number;
}
