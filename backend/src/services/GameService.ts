import RedisService from "./RedisService";
import GameStateService from "./GameStateService";
import UserModel from "../models/UserModel";
import GameHistoryModel from "../models/GameHistoryModel";
import type Server from "../utils/Server";
import type { Card, GameType, GameCurrency, GameState, HitResult, StandResult, StartResult } from "../interfaces/Game";

export default class GameService {
    private static server: Server;

    public static init(server: Server): void {
        this.server = server;
    }

    private static getCurrency(gameType: GameType): GameCurrency {
        return gameType === "rank_player" ? "tokens" : "coins";
    }

    public static async startGame(userId: number, gameType: GameType, bet: number, socketId: string): Promise<StartResult> {
        if (gameType !== "quick_ai") {
            return { ok: false, message: "Game mode not available" };
        }

        const currency = this.getCurrency(gameType);
        const user = await UserModel.selectUser(userId);
        if (!user || user[currency] < bet) {
            return { ok: false, message: `Insufficient ${currency}` };
        }

        const rawId = await RedisService.Redis.incr("socket:game:id");
        const gameId = typeof rawId === "number" ? rawId : parseInt(rawId as string);

        const deck = this.server.Blackjack.createDeck();
        const playerHand: Card[] = [deck[0], deck[2]];
        const dealerHand: Card[] = [deck[1], deck[3]];
        const remainingDeck = deck.slice(4);
        const playerValue = this.server.Blackjack.calcValue(playerHand);
        const dealerValue = this.server.Blackjack.calcValue(dealerHand);
        const isBlackjack = playerValue === 21;
        const isDealerBlackjack = dealerValue === 21;

        let status: GameState["status"] = "playing";
        let result: GameState["result"] = "pending";
        let reward = 0;

        if (isBlackjack || isDealerBlackjack) {
            status = "game-over";
            if (isBlackjack && isDealerBlackjack) {
                result = "push";
                reward = bet;
            } else if (isBlackjack) {
                result = "win";
                reward = Math.floor(bet * 2.5); // Blackjack pays 3:2
            } else {
                result = "lose";
            }
        }

        const gameState: GameState = {
            gameId,
            userId,
            gameType,
            currency,
            status,
            playerBet: bet,
            playerHand: JSON.stringify(playerHand),
            dealerHand: JSON.stringify(dealerHand),
            playerValue,
            dealerValue: this.server.Blackjack.calcValue([dealerHand[0]]),
            result,
            reward,
            deck: JSON.stringify(remainingDeck),
            createdAt: Date.now(),
        };

        await GameStateService.saveGameState(gameId, gameState);
        await GameStateService.setUserCurrentGame(userId, gameId);
        await GameStateService.setSocketUser(socketId, userId);
        await UserModel.decreaseBalance(userId, currency, bet);

        const balance = user[currency] - bet + reward;

        if (status === "game-over") {
            if (reward > 0) {
                await UserModel.increaseBalance(userId, currency, reward);
            }
            await GameHistoryModel.createGameHistory(userId, 0, result, gameType, bet, reward);
            return {
                ok: true,
                gameOver: true,
                gameId,
                playerHand,
                dealerHand,
                playerValue,
                dealerValue,
                bet,
                currency,
                balance,
                blackjack: isBlackjack,
                dealerBlackjack: isDealerBlackjack,
                result: result as "win" | "lose" | "push",
                reward,
            };
        }

        return {
            ok: true,
            gameOver: false,
            gameId,
            playerHand,
            dealerHand: [dealerHand[0]],
            playerValue,
            dealerValue: this.server.Blackjack.calcValue([dealerHand[0]]),
            bet,
            currency,
            balance,
        };
    }

    public static async hitGame(gameId: number, userId: number): Promise<HitResult> {
        const gameState = await GameStateService.getGameState(gameId);
        if (!gameState || gameState.userId !== userId) {
            return { ok: false, message: "Game not found or unauthorized" };
        }
        if (gameState.status === "game-over") {
            return { ok: false, message: "Game is already over" };
        }

        const playerHand: Card[] = JSON.parse(gameState.playerHand);
        const deck: Card[] = JSON.parse(gameState.deck);
        if (deck.length === 0) {
            return { ok: false, message: "Deck is empty" };
        }

        playerHand.push(deck.shift()!);
        const playerValue = this.server.Blackjack.calcValue(playerHand);
        gameState.playerHand = JSON.stringify(playerHand);
        gameState.playerValue = playerValue;
        gameState.deck = JSON.stringify(deck);

        if (playerValue > 21) {
            gameState.result = "lose";
            gameState.status = "game-over";
            gameState.reward = 0;
            await GameStateService.saveGameState(gameId, gameState);
            await GameHistoryModel.createGameHistory(gameState.userId, 0, "lose", gameState.gameType, gameState.playerBet, 0);
            return { ok: true, outcome: "bust", playerHand, playerValue };
        }

        if (playerValue === 21) {
            const resolved = await this.server.Blackjack.resolveDealer(gameState, GameStateService.saveGameState.bind(GameStateService));
            await GameHistoryModel.createGameHistory(gameState.userId, 0, resolved.result, gameState.gameType, gameState.playerBet, resolved.reward);
            return { ok: true, outcome: "finished", gameId, ...resolved };
        }

        await GameStateService.saveGameState(gameId, gameState);
        return { ok: true, outcome: "continue", playerHand, playerValue };
    }

    public static async standGame(gameId: number, userId: number): Promise<StandResult> {
        const gameState = await GameStateService.getGameState(gameId);
        if (!gameState || gameState.userId !== userId) {
            return { ok: false, message: "Game not found or unauthorized" };
        }
        if (gameState.status === "game-over") {
            return { ok: false, message: "Game is already over" };
        }

        const resolved = await this.server.Blackjack.resolveDealer(gameState, GameStateService.saveGameState.bind(GameStateService));
        await GameHistoryModel.createGameHistory(gameState.userId, 0, resolved.result, gameState.gameType, gameState.playerBet, resolved.reward);
        return { ok: true, gameId, ...resolved };
    }
}
