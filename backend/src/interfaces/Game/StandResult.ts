import { Card } from "./Card";
import { GameState } from "./GameState";
import { GameCurrency } from "./GameType";

export type StandResult =
    | { ok: false; message: string }
    | {
          ok: true;
          gameId: number;
          playerHand: Card[];
          dealerHand: Card[];
          playerValue: number;
          dealerValue: number;
          result: Omit<GameState["result"], "pending">;
          reward: number;
          currency: GameCurrency;
          balance: number;
      };
