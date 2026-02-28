import { Hono } from "hono";
import Server from "../utils/Server";
import RedisService from "../services/RedisService";
import UserModel from "../models/UserModel";

interface Card {
    suit: string;
    rank: string;
    value: number;
}

const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// helper functions for cache
const generateGameId = async (): Promise<number> => {
    const id = await RedisService.Redis.incr("game:id");
    return typeof id === "number" ? id : parseInt(id, 10);
};

const saveGameState = async (game: any) => {
    const key = `game:${game.id}`;
    await RedisService.set(key, JSON.stringify(game));
    // expire after 1 hour to avoid stale data
    await RedisService.expire(key, 3600);
};

const loadGameState = async (gameId: number) => {
    const data = await RedisService.get<string>(`game:${gameId}`);
    if (!data) return null;
    return JSON.parse(data);
};

const addGameToUserHistory = async (userId: number, gameId: number) => {
    await RedisService.Redis.lpush(`user:games:${userId}`, gameId.toString());
    // keep only last 100 games
    await RedisService.Redis.ltrim(`user:games:${userId}`, 0, 99);
};

const createDeck = (): Card[] => {
    const newDeck: Card[] = [];
    for (let i = 0; i < 6; i++) {
        for (const suit of suits) {
            for (const rank of ranks) {
                const value =
                    rank === "A" ? 11 : rank === "J" || rank === "Q" || rank === "K" ? 10 : parseInt(rank);
                newDeck.push({ suit, rank, value });
            }
        }
    }
    return newDeck.sort(() => Math.random() - 0.5);
};

const calculateHandValue = (hand: Card[]): number => {
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
};

export default (app: Hono, server: Server) => {
    // Start a new game
    app.post("/start", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const { gameType, bet } = await c.req.json();

            if (!gameType || !bet || bet <= 0) {
                return c.json({ error: "Invalid bet or gameType" }, 400);
            }

            const user = await UserModel.selectUser(userId);
            if (!user || user.coins < bet) {
                return c.json({ error: "Insufficient coins" }, 400);
            }

            // generate a new game id and create initial cache object
            const gameId = await generateGameId();
            const deck = createDeck();
            const playerHand: Card[] = [deck[0], deck[2]];
            const dealerHand: Card[] = [deck[1], deck[3]];
            const playerValue = calculateHandValue(playerHand);
            const dealerValue = calculateHandValue([dealerHand[0]]);

            const gameState = {
                id: gameId,
                userId,
                gameType,
                status: "betting",
                playerBet: bet,
                playerHand: JSON.stringify(playerHand),
                dealerHand: JSON.stringify(dealerHand),
                playerValue,
                dealerValue,
                result: "pending",
                reward: 0
            };

            await saveGameState(gameState);
            await addGameToUserHistory(userId, gameId);

            // Deduct coins from user
            await UserModel.updateUser(userId, "coins", user.coins - bet);

            return c.json({
                gameId,
                playerHand,
                dealerHand: [dealerHand[0]], // Only show first card
                playerValue,
                dealerValue,
                deck: JSON.stringify(deck.slice(4)) // Save remaining deck
            });
        } catch (error) {
            server.error("GameRoute", `Error starting game: ${error}`);
            return c.json({ error: "Failed to start game" }, 500);
        }
    });

    // Hit action
    app.post("/:gameId/hit", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const gameId = parseInt(c.req.param("gameId"));
            const { deck } = await c.req.json();

            const game = await loadGameState(gameId);
            if (!game || game.userId !== userId) {
                return c.json({ error: "Game not found" }, 404);
            }

            const playerHand: Card[] = JSON.parse(game.playerHand || "[]");
            const parsedDeck: Card[] = JSON.parse(deck || "[]");

            if (parsedDeck.length === 0) {
                return c.json({ error: "Deck is empty" }, 400);
            }

            const newCard = parsedDeck[0];
            playerHand.push(newCard);
            const newPlayerValue = calculateHandValue(playerHand);

            const updatedDeck = parsedDeck.slice(1);

            // Update game state
            game.playerHand = JSON.stringify(playerHand);
            game.playerValue = newPlayerValue;
            game.status = "playing";
            await saveGameState(game);

            if (newPlayerValue > 21) {
                // Bust
                game.result = "lose";
                game.reward = 0;
                game.status = "completed";
                await saveGameState(game);

                return c.json({
                    playerHand,
                    playerValue: newPlayerValue,
                    status: "bust",
                    result: "lose",
                    deck: JSON.stringify(updatedDeck)
                });
            }

            return c.json({
                playerHand,
                playerValue: newPlayerValue,
                status: "hit",
                deck: JSON.stringify(updatedDeck)
            });
        } catch (error) {
            server.error("GameRoute", `Error on hit: ${error}`);
            return c.json({ error: "Failed to hit" }, 500);
        }
    });

    // Stand action
    app.post("/:gameId/stand", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const gameId = parseInt(c.req.param("gameId"));
            const { deck } = await c.req.json();

            const game = await loadGameState(gameId);
            if (!game || game.userId !== userId) {
                return c.json({ error: "Game not found" }, 404);
            }

            const playerHand: Card[] = JSON.parse(game.playerHand || "[]");
            const dealerHand: Card[] = JSON.parse(game.dealerHand || "[]");
            const parsedDeck: Card[] = JSON.parse(deck || "[]");

            let dealerCards = [...dealerHand];
            let deckIndex = 0;

            // Dealer plays
            while (calculateHandValue(dealerCards) < 17 && deckIndex < parsedDeck.length) {
                dealerCards.push(parsedDeck[deckIndex]);
                deckIndex++;
            }

            const playerValue = calculateHandValue(playerHand);
            const dealerValue = calculateHandValue(dealerCards);

            let result: "win" | "lose" | "push";
            let reward = 0;

            if (dealerValue > 21) {
                result = "win";
                reward = game.playerBet * 2;
            } else if (playerValue > dealerValue) {
                result = "win";
                reward = game.playerBet * 2;
            } else if (dealerValue > playerValue) {
                result = "lose";
                reward = 0;
            } else {
                result = "push";
                reward = game.playerBet;
            }

            // Update game result in cache
            game.result = result;
            game.reward = reward;
            game.status = "completed";
            await saveGameState(game);

            // Update user coins and cash
            const user = await UserModel.selectUser(userId);
            if (user) {
                await UserModel.updateUser(userId, "coins", user.coins + reward);
            }

            return c.json({
                playerHand,
                dealerHand: dealerCards,
                playerValue,
                dealerValue,
                result,
                reward,
                status: "game-over"
            });
        } catch (error) {
            server.error("GameRoute", `Error on stand: ${error}`);
            return c.json({ error: "Failed to stand" }, 500);
        }
    });

    // Get game history
    app.get("/history", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const limit = parseInt(c.req.query("limit") || "20");

            const ids: string[] = await RedisService.Redis.lrange(`user:games:${userId}`, 0, limit - 1);
            const games = [] as any[];
            for (const idStr of ids) {
                const g = await loadGameState(parseInt(idStr));
                if (g) games.push(g);
            }
            return c.json(games);
        } catch (error) {
            server.error("GameRoute", `Error fetching history: ${error}`);
            return c.json({ error: "Failed to fetch history" }, 500);
        }
    });

    // Get game by ID
    app.get("/:gameId", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const gameId = parseInt(c.req.param("gameId"));

            const game = await loadGameState(gameId);
            if (!game || game.userId !== userId) {
                return c.json({ error: "Game not found" }, 404);
            }

            return c.json(game);
        } catch (error) {
            server.error("GameRoute", `Error fetching game: ${error}`);
            return c.json({ error: "Failed to fetch game" }, 500);
        }
    });

    return app;
};
