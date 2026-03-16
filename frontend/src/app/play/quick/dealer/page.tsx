"use client";

import Navbar from "@components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";
import { getCardBackImage, getCardImagePath, getCardSkin, getChipImagePath, getChipSkin, getTableImage, getTableSkin } from "@lib/skinUtils";

import config from "@/config";

import styles from "./page.module.css";

interface Card {
  suit: string;
  rank: string;
  value: number;
}

interface ChipStack {
  value: number;
  count: number;
  image: string;
}

interface GameStartAck {
  ok?: boolean;
  message?: string;
  gameId: number;
  playerHand: Card[];
  dealerHand: Card[];
  bet: number;
  balance?: number;
  coins?: number;
  result?: "win" | "lose" | "draw";
  blackjack?: boolean;
}

interface GameActionAck {
  ok?: boolean;
  message?: string;
  playerHand: Card[];
  dealerHand?: Card[];
  bust?: boolean;
  balance?: number;
  coins?: number;
  result?: "win" | "lose" | "draw";
}

type GameStatus = "betting" | "playing" | "game-over";

const CHIP_VALUES = [1, 5, 10, 25, 100, 500, 1000];

export default function Dealer() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("betting");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState<number>(0);
  const [pendingBet, setPendingBet] = useState<number>(0);
  const [playerChips, setPlayerChips] = useState<number>(0);
  const playerChipsRef = useRef<number>(0);
  useEffect(() => {
    playerChipsRef.current = playerChips;
  }, [playerChips]);
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [gameId, setGameId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number>(0);
  const [timer, setTimer] = useState<number>(10);
  const [cardSkin] = useState<string>(getCardSkin);
  const [chipSkin] = useState<string>(getChipSkin);
  const [tableSkin] = useState<string>(getTableSkin);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getChipStacks = (amount: number): ChipStack[] => {
    const chipValues = [1000, 500, 100, 25, 10, 5, 1];
    let remaining = Math.max(0, Math.floor(amount));
    const stacks: ChipStack[] = [];
    for (const value of chipValues) {
      if (remaining < value) continue;
      const count = Math.floor(remaining / value);
      remaining -= count * value;
      stacks.push({ value, count, image: getChipImagePath(value, chipSkin) });
    }
    return stacks;
  };

  const startTimer = () => {
    setTimer(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const calculateHandValue = (hand: Card[]) => {
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

  useEffect(() => {
    (async () => {
      const user = await UserService.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      setUserId(user.id);
      setPlayerChips(user.coins);

      LocalStorage.setItem("coins", user.coins.toString());

      const socket = io(config.socketUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        auth: { token: LocalStorage.getItem("accessToken") },
      });

      socket.on("connect", () => console.log("Socket connected"));

      socket.on("game:player-hit", (data: { playerHand: Card[]; playerValue: number }) => {
        setPlayerHand(data.playerHand);
        startTimer();
      });

      socket.on("game:bust", (data: { playerHand: Card[]; playerValue: number }) => {
        stopTimer();
        setPlayerHand(data.playerHand);
        setResult("BUST! Dealer wins");
        setGameStatus("game-over");
        setIsLoading(false);
      });

      socket.on(
        "game:finished",
        (data: { playerHand: Card[]; dealerHand: Card[]; playerValue: number; dealerValue: number; result: "win" | "lose" | "draw"; reward: number; balance?: number; coins?: number }) => {
          stopTimer();
          setPlayerHand(data.playerHand);
          setDealerHand(data.dealerHand);
          const msg = data.result === "win" ? "You win! 🎉" : data.result === "draw" ? "Draw!" : "Dealer wins";
          setResult(msg);
          const nextChips = typeof data.balance === "number" ? data.balance : typeof data.coins === "number" ? data.coins : playerChipsRef.current;
          setPlayerChips(nextChips);
          LocalStorage.setItem("coins", nextChips.toString());
          setGameStatus("game-over");
          setIsLoading(false);
        }
      );

      socket.on("disconnect", () => console.log("Socket disconnected"));

      socketRef.current = socket;
    })();

    return () => {
      stopTimer();
      socketRef.current?.disconnect();
    };
  }, [router]);

  const startGame = (betAmount: number) => {
    if (betAmount <= 0 || betAmount > playerChips) {
      setMessage("Invalid bet amount");
      return;
    }
    if (!socketRef.current) {
      setMessage("Not connected");
      return;
    }
    if (!userId) {
      setMessage("User not loaded yet, please wait");
      return;
    }

    setIsLoading(true);
    socketRef.current.emit("game:start", { userId, gameType: "quick_ai", bet: betAmount }, (ack: GameStartAck) => {
      setIsLoading(false);
      if (!ack?.ok) {
        setMessage(ack?.message || "Failed to start game");
        return;
      }
      setGameId(ack.gameId);
      setPlayerHand(ack.playerHand);
      setDealerHand(ack.dealerHand);
      setBet(ack.bet);
      const nextChips = typeof ack?.balance === "number" ? ack.balance : typeof ack?.coins === "number" ? ack.coins : playerChips;
      setPlayerChips(nextChips);
      LocalStorage.setItem("coins", nextChips.toString());
      setMessage("");

      // Blackjack on initial deal — game is already over
      if (ack.result !== undefined) {
        const msg = ack.result === "win" ? (ack.blackjack ? "Blackjack! 🎉 You win!" : "You win! 🎉") : ack.result === "draw" ? "Draw! Both Blackjack" : "Dealer Blackjack — Dealer wins";
        setResult(msg);
        setGameStatus("game-over");
        stopTimer();
      } else {
        setResult("");
        setGameStatus("playing");
        startTimer();
      }
    });
  };

  const hit = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return;
    setIsLoading(true);
    socketRef.current.emit("game:hit", { gameId, userId }, (ack: GameActionAck) => {
      setIsLoading(false);
      if (!ack?.ok) {
        setMessage(ack?.message || "Failed to hit");
        return;
      }
      setPlayerHand(ack.playerHand);
      if (ack.bust) {
        stopTimer();
        setResult("BUST! Dealer wins");
        setGameStatus("game-over");
      } else if (ack.result !== undefined) {
        // Player hit exactly 21 — dealer resolved automatically
        stopTimer();
        if (ack.dealerHand) setDealerHand(ack.dealerHand);
        const msg = ack.result === "win" ? "You win! 🎉" : ack.result === "draw" ? "Draw!" : "Dealer wins";
        setResult(msg);
        const nextChips = typeof ack.balance === "number" ? ack.balance : typeof ack.coins === "number" ? ack.coins : playerChips;
        setPlayerChips(nextChips);
        LocalStorage.setItem("coins", nextChips.toString());
        setGameStatus("game-over");
      } else {
        startTimer();
      }
    });
  };

  const stand = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return;
    setIsLoading(true);
    stopTimer();
    socketRef.current.emit("game:stand", { gameId, userId }, (ack: GameActionAck) => {
      if (!ack?.ok) {
        setIsLoading(false);
        setMessage(ack?.message || "Failed to stand");
      }
    });
  };

  const addChipToBet = (value: number) => {
    if (pendingBet + value > playerChips) return;
    setPendingBet((prev) => prev + value);
    setMessage("");
  };

  const clearBet = () => setPendingBet(0);

  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);
  const chipStacks = getChipStacks(bet);
  const resultClassName = result.includes("win") ? styles.resultWin : result.includes("Draw") ? styles.resultDraw : styles.resultLose;

  const getDealerDealStyle = (cardIndex: number): CSSProperties => ({
    animationDelay: gameStatus === "game-over" ? "0s" : `${cardIndex * 0.12}s`,
  });

  const getPlayerDealStyle = (cardIndex: number): CSSProperties => ({
    animationDelay: gameStatus === "game-over" ? "0s" : gameStatus === "playing" && playerHand.length > 2 ? "0.02s" : `${cardIndex * 0.12 + 0.08}s`,
  });

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.main}>
        <div className={styles.tableWrap}>
          <button type="button" onClick={() => router.push("/play")} className={styles.backButton}>
            ← Back
          </button>
          <div className={styles.table}>
            <Image src={getTableImage(tableSkin)} alt="game table" fill style={{ objectFit: "fill", zIndex: 0 }} unoptimized />
            <div className={styles.innerShadow} />

            {gameStatus !== "betting" && (
              <div className={styles.chipStackPanel}>
                <div className={styles.chipStackVisual}>
                  {chipStacks.map((stack, si) =>
                    Array.from({ length: Math.min(stack.count, 4) }).map((_, ci) => (
                      <Image
                        key={`${si}-${ci}`}
                        src={stack.image}
                        alt={`${stack.value}`}
                        width={60}
                        height={60}
                        unoptimized
                        className={`${styles.chipImage} ${si % 2 === 0 ? styles.stackEven : styles.stackOdd} ${styles[`stack${Math.min(si, 6)}` as keyof typeof styles]} ${styles[`chip${Math.min(ci, 3)}` as keyof typeof styles]}`}
                      />
                    ))
                  )}
                </div>
                <span className={styles.chipLabel}>Bet: {bet}</span>
              </div>
            )}

            {gameStatus !== "betting" && (
              <div className={styles.deckZone} aria-hidden="true">
                <Image src={getCardBackImage(cardSkin)} alt="Deck" width={85} height={125} unoptimized className={`${styles.deckCard} ${styles.deckCardBottom}`.trim()} />
                <Image src={getCardBackImage(cardSkin)} alt="Deck" width={85} height={125} unoptimized className={`${styles.deckCard} ${styles.deckCardTop}`.trim()} />
              </div>
            )}

            <div className={styles.dealerRow}>
              {gameStatus !== "betting" &&
                dealerHand.map((card, i) => (
                  <div key={i} className={`${styles.cardFrame} ${styles.dealCard} ${styles.dealToDealer} ${gameStatus === "game-over" ? styles.cardFlip : ""}`.trim()} style={getDealerDealStyle(i)}>
                    <Image src={getCardImagePath(card, cardSkin)} alt={`${card.rank}${card.suit}`} width={85} height={125} unoptimized className={styles.cardImage} />
                  </div>
                ))}
              {gameStatus === "playing" && (
                <div className={`${styles.cardFrame} ${styles.dealCard} ${styles.dealToDealer}`.trim()} style={getDealerDealStyle(dealerHand.length)}>
                  <Image src={getCardBackImage(cardSkin)} alt="Card back" width={85} height={125} unoptimized className={styles.cardImage} />
                </div>
              )}
            </div>

            {gameStatus !== "betting" && (
              <div className={`${styles.scoreWrap} ${styles.dealerScoreWrap}`}>
                <div className={styles.scoreBadge}>{gameStatus === "playing" ? dealerHand.reduce((acc, c) => acc + c.value, 0) : dealerValue}</div>
                {gameStatus === "playing" && <span className={styles.scoreTimer}>{timer} s</span>}
              </div>
            )}

            {gameStatus !== "betting" && (
              <div className={`${styles.scoreWrap} ${styles.playerScoreWrap}`}>
                <div className={styles.scoreBadge}>{playerValue}</div>
              </div>
            )}

            <div className={styles.playerRow}>
              {gameStatus !== "betting" &&
                playerHand.map((card, i) => (
                  <div key={i} className={`${styles.cardFrame} ${styles.dealCard} ${styles.dealToPlayer}`.trim()} style={getPlayerDealStyle(i)}>
                    <Image src={getCardImagePath(card, cardSkin)} alt={`${card.rank}${card.suit}`} width={85} height={125} unoptimized className={styles.cardImage} />
                  </div>
                ))}
            </div>

            {gameStatus === "betting" && (
              <div className={styles.bettingOverlay}>
                <div className={styles.bettingPanel}>
                  <p className={styles.bettingTitle}>PLACE YOUR BET</p>
                  <div className={styles.pendingBet}>{pendingBet > 0 ? pendingBet.toLocaleString() : "—"}</div>
                  <div className={styles.chipRow}>
                    {CHIP_VALUES.map((v) => (
                      <button key={v} className={styles.chipButton} onClick={() => addChipToBet(v)} title={`+${v}`}>
                        <Image src={getChipImagePath(v, chipSkin)} alt={`${v}`} width={52} height={52} unoptimized className={styles.chipButtonImage} />
                      </button>
                    ))}
                  </div>
                </div>
                {message && <p className={styles.inlineError}>{message}</p>}
              </div>
            )}

            {result && <div className={`${styles.resultBadge} ${resultClassName}`.trim()}>{result}</div>}
          </div>
        </div>

        <div className={styles.controls}>
          {gameStatus === "betting" && (
            <div className={styles.controlsRow}>
              <button onClick={clearBet} className={`${styles.controlButton} ${styles.clearButton}`.trim()}>
                Clear
              </button>
              <button
                onClick={() => startGame(pendingBet)}
                disabled={isLoading || pendingBet <= 0}
                className={`${styles.controlButton} ${styles.dealButton} ${pendingBet > 0 ? styles.dealButtonReady : styles.dealButtonIdle}`.trim()}>
                {isLoading ? "Dealing…" : "DEAL"}
              </button>
            </div>
          )}

          {gameStatus === "playing" && (
            <div className={`${styles.controlsRow} ${styles.playingRow}`.trim()}>
              <button onClick={hit} disabled={isLoading} className={`${styles.controlButton} ${styles.hitButton}`.trim()}>
                HIT
              </button>
              <button onClick={stand} disabled={isLoading} className={`${styles.controlButton} ${styles.standButton}`.trim()}>
                STAND
              </button>
            </div>
          )}

          {gameStatus === "game-over" && (
            <button
              onClick={() => {
                setGameStatus("betting");
                setPlayerHand([]);
                setDealerHand([]);
                setResult("");
                setMessage("");
                setPendingBet(0);
              }}
              disabled={playerChips <= 0}
              className={`${styles.controlButton} ${styles.playAgainButton}`.trim()}>
              {playerChips <= 0 ? "Out of chips!" : "Play Again"}
            </button>
          )}

          {message && gameStatus !== "betting" && <p className={styles.bottomMessage}>{message}</p>}
        </div>
      </div>
    </div>
  );
}
