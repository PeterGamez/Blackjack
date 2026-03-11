import { Card } from "./Card";
import { GameState } from "./GameState";
import { GameCurrency } from "./GameType";

export type HitResult =
    | { ok: false; message: string }
    | { ok: true; outcome: "bust"; playerHand: Card[]; playerValue: number }
    | {
          ok: true;
          outcome: "finished";
          gameId: number;
          playerHand: Card[];
          dealerHand: Card[];
          playerValue: number;
          dealerValue: number;
          result: Omit<GameState["result"], "pending">;
          reward: number;
          currency: GameCurrency;
          balance: number;
      }
    | { ok: true; outcome: "continue"; playerHand: Card[]; playerValue: number };
