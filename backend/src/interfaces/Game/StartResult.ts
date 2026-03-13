import type { Card } from "./Card";
import type { GameStateInterface } from "./GameStateInterface";
import type { GameCurrency } from "./GameType";

export type StartResult =
    | { ok: false; message: string }
    | {
          ok: true;
          gameOver: false;
          gameId: number;
          playerHand: Card[];
          dealerHand: Card[];
          playerValue: number;
          dealerValue: number;
          bet: number;
          currency: GameCurrency;
          balance: number;
      }
    | {
          ok: true;
          gameOver: true;
          gameId: number;
          playerHand: Card[];
          dealerHand: Card[];
          playerValue: number;
          dealerValue: number;
          bet: number;
          currency: GameCurrency;
          balance: number;
          blackjack: boolean;
          dealerBlackjack: boolean;
          result: Omit<GameStateInterface["result"], "pending">;
          reward: number;
      };
