import { Card } from "./Card";
import { GameState } from "./GameState";
import { GameCurrency } from "./GameType";

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
          result: Omit<GameState["result"], "pending">;
          reward: number;
      };
