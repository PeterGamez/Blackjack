import UserModel from "../models/UserModel";
import type { Card, GameState, GameCurrency } from "../interfaces/Game";

export default class Blackjack {
    public static readonly SUITS = ["♠", "♥", "♦", "♣"];
    public static readonly RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    public static createDeck(): Card[] {
        const deck: Card[] = [];
        for (let i = 0; i < 6; i++) {
            for (const suit of this.SUITS) {
                for (const rank of this.RANKS) {
                    const value = rank === "A" ? 11 : ["J", "Q", "K"].includes(rank) ? 10 : parseInt(rank);
                    deck.push({ suit, rank, value });
                }
            }
        }
        return deck.sort(() => Math.random() - 0.5);
    }

    public static calcValue(hand: Card[]): number {
        let value = 0;
        let aces = 0;
        for (const card of hand) {
            value += card.value;
            if (card.rank === "A") aces++;
        }
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        return value;
    }

    public static async resolveDealer(
        gameState: GameState,
        saveGameState: (gameId: number, state: GameState) => Promise<void>
    ): Promise<{
        playerHand: Card[];
        dealerHand: Card[];
        playerValue: number;
        dealerValue: number;
        result: "win" | "lose" | "push";
        reward: number;
        currency: GameCurrency;
        balance: number;
    }> {
        const playerHand: Card[] = JSON.parse(gameState.playerHand);
        const dealerHand: Card[] = JSON.parse(gameState.dealerHand);
        const deck: Card[] = JSON.parse(gameState.deck);

        while (this.calcValue(dealerHand) < 17 && deck.length > 0) {
            dealerHand.push(deck.shift()!);
        }

        const playerValue = this.calcValue(playerHand);
        const dealerValue = this.calcValue(dealerHand);

        let result: "win" | "lose" | "push";
        let reward = 0;

        if (dealerValue > 21 || playerValue > dealerValue) {
            result = "win";
            reward = gameState.playerBet * 2;
        } else if (dealerValue > playerValue) {
            result = "lose";
            reward = 0;
        } else {
            result = "push";
            reward = gameState.playerBet;
        }

        gameState.dealerHand = JSON.stringify(dealerHand);
        gameState.dealerValue = dealerValue;
        gameState.result = result;
        gameState.reward = reward;
        gameState.status = "game-over";
        gameState.deck = JSON.stringify(deck);

        await saveGameState(gameState.gameId, gameState);

        const { currency } = gameState;
        const user = await UserModel.selectUser(gameState.userId);
        let balance = user?.[currency] ?? 0;
        if (reward > 0 && user) {
            balance = user[currency] + reward;
            await UserModel.increaseBalance(gameState.userId, currency, reward);
        }

        return { playerHand, dealerHand, playerValue, dealerValue, result, reward, currency, balance };
    }
}
