"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

import config from "@config";

import { getEffectVolume } from "@components/ButtonSoundProvider";
import Navbar from "@components/Navbar";

import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";

import { getCardBackImage, getCardImage, getCardSkin, getChipImage, getChipSkin, getTableImage, getTableSkin } from "@utils/skinUtils";

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

interface ForcedCardPayload {
  suit: string;
  rank: string;
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
  reward?: number;
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
  reward?: number;
}

type GameStatus = "betting" | "playing" | "game-over";

type PopupType = "win" | "lose" | "draw";

const CHIP_VALUES = [1, 5, 10, 25, 100, 500, 1000];
const FORCED_CARD_SUITS = ["♠", "♥", "♦", "♣"];
const FORCED_CARD_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CARD_DRAW_SOUND_SRC = "/sounds/draw.mp3";
const BLACKJACK_LOSE_SOUND_SRC = "/sounds/lose.mp3";
const BLACKJACK_WIN_SOUND_SRC = "/sounds/win.mp3";
const BLACKJACK_DRAW_SOUND_SRC = "/sounds/gamedraw.mp3";
const DEALER_BLACKJACK_SOUND_SRC = "/sounds/blackjack.mp3";
const CARD_DRAW_SOUND_START_AT_SECONDS = 0;
const BLACKJACK_LOSE_SOUND_START_AT_SECONDS = 0;
const BLACKJACK_WIN_SOUND_START_AT_SECONDS = 0.5;
const BLACKJACK_DRAW_SOUND_START_AT_SECONDS = 0;
const DEALER_BLACKJACK_SOUND_START_AT_SECONDS = 0.8;
const BLACKJACK_WIN_SOUND_DELAY_MS = 0;
const BLACKJACK_DRAW_SOUND_DELAY_MS = 0;
const DEALER_BLACKJACK_SOUND_DELAY_MS = 0;
const CARD_DRAW_SOUND_GAIN = 1;
const BLACKJACK_LOSE_SOUND_GAIN = 0.5;
const BLACKJACK_WIN_SOUND_GAIN = 0.5;
const BLACKJACK_DRAW_SOUND_GAIN = 0.5;
const DEALER_BLACKJACK_SOUND_GAIN = 0.5;

export default function Dealer() {
  const router = useRouter();
  const socketRef = useRef<Socket>(null);
  const cardDrawAudioPoolRef = useRef<HTMLAudioElement[]>([]);
  const blackjackLoseAudioRef = useRef<HTMLAudioElement>(null);
  const blackjackWinAudioRef = useRef<HTMLAudioElement>(null);
  const blackjackDrawAudioRef = useRef<HTMLAudioElement>(null);
  const dealerBlackjackAudioRef = useRef<HTMLAudioElement>(null);
  const prevPlayerCardCountRef = useRef(0);
  const prevDealerCardCountRef = useRef(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("betting");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState<number>(0);
  const betRef = useRef<number>(0);
  const [pendingBet, setPendingBet] = useState<number>(0);
  const [playerChips, setPlayerChips] = useState<number>(0);
  const playerChipsRef = useRef<number>(0);
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isBlackjackResult, setIsBlackjackResult] = useState(false);
  const [roundPayout, setRoundPayout] = useState<number>(0);
  const [gameId, setGameId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number>(0);
  const [timer, setTimer] = useState<number>(10);
  const [dealerRevealIndex, setDealerRevealIndex] = useState<number | null>(null);
  const [isDealerDrawing, setIsDealerDrawing] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [cardSkin, setCardSkin] = useState<string>("default");
  const [chipSkin, setChipSkin] = useState<string>("default");
  const [tableSkin, setTableSkin] = useState<string>("default");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminHitDropdownOpen, setIsAdminHitDropdownOpen] = useState<boolean>(false);
  const [forceNextHitCard, setForceNextHitCard] = useState<boolean>(false);
  const [forcedSuit, setForcedSuit] = useState<string>("♠");
  const [forcedRank, setForcedRank] = useState<string>("A");

  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const standResolveRef = useRef(false);

  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const getScaledVolume = (gain: number): number => {
    return Math.min(1, Math.max(0, getEffectVolume() * gain));
  };

  const playCardDrawSound = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (cardDrawAudioPoolRef.current.length === 0) {
      const pool = Array.from({ length: 4 }, () => {
        const audio = new Audio(CARD_DRAW_SOUND_SRC);
        audio.preload = "auto";
        audio.load();
        return audio;
      });
      cardDrawAudioPoolRef.current = pool;
    }

    const audio = cardDrawAudioPoolRef.current.find((item) => item.paused || item.ended) || cardDrawAudioPoolRef.current[0];
    audio.pause();
    audio.currentTime = CARD_DRAW_SOUND_START_AT_SECONDS;
    audio.volume = getScaledVolume(CARD_DRAW_SOUND_GAIN);
    void audio.play().catch(() => {
      // Ignore browser/media playback errors.
    });
  }, []);

  const playBlackjackLoseSound = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!blackjackLoseAudioRef.current) {
      blackjackLoseAudioRef.current = new Audio(BLACKJACK_LOSE_SOUND_SRC);
      blackjackLoseAudioRef.current.preload = "auto";
      blackjackLoseAudioRef.current.load();
    }

    const audio = blackjackLoseAudioRef.current;
    audio.pause();
    audio.currentTime = BLACKJACK_LOSE_SOUND_START_AT_SECONDS;
    audio.volume = getScaledVolume(BLACKJACK_LOSE_SOUND_GAIN);
    void audio.play().catch(() => {
      // Ignore browser/media playback errors.
    });
  }, []);

  const playBlackjackWinSound = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!blackjackWinAudioRef.current) {
      blackjackWinAudioRef.current = new Audio(BLACKJACK_WIN_SOUND_SRC);
      blackjackWinAudioRef.current.preload = "auto";
      blackjackWinAudioRef.current.load();
    }

    const audio = blackjackWinAudioRef.current;

    // รอ delay ก่อนแล้วค่อยเล่นเสียง
    setTimeout(() => {
      audio.pause();
      audio.currentTime = BLACKJACK_WIN_SOUND_START_AT_SECONDS;
      audio.volume = getScaledVolume(BLACKJACK_WIN_SOUND_GAIN);
      void audio.play().catch(() => {
        // Ignore browser/media playback errors.
      });

      // หยุดเสียงหลัง 3 วินาที
      setTimeout(() => {
        if (blackjackWinAudioRef.current) {
          blackjackWinAudioRef.current.pause();
        }
      }, 3000);
    }, BLACKJACK_WIN_SOUND_DELAY_MS);
  }, []);

  const playBlackjackDrawSound = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!blackjackDrawAudioRef.current) {
      blackjackDrawAudioRef.current = new Audio(BLACKJACK_DRAW_SOUND_SRC);
      blackjackDrawAudioRef.current.preload = "auto";
      blackjackDrawAudioRef.current.load();
    }

    const audio = blackjackDrawAudioRef.current;

    // รอ delay ก่อนแล้วค่อยเล่นเสียง
    setTimeout(() => {
      audio.pause();
      audio.currentTime = BLACKJACK_DRAW_SOUND_START_AT_SECONDS;
      audio.volume = getScaledVolume(BLACKJACK_DRAW_SOUND_GAIN);
      void audio.play().catch(() => {
        // Ignore browser/media playback errors.
      });

      // หยุดเสียงหลัง 3 วินาที
      setTimeout(() => {
        if (blackjackDrawAudioRef.current) {
          blackjackDrawAudioRef.current.pause();
        }
      }, 3000);
    }, BLACKJACK_DRAW_SOUND_DELAY_MS);
  }, []);

  const playDealerBlackjackSound = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!dealerBlackjackAudioRef.current) {
      dealerBlackjackAudioRef.current = new Audio(DEALER_BLACKJACK_SOUND_SRC);
      dealerBlackjackAudioRef.current.preload = "auto";
      dealerBlackjackAudioRef.current.load();
    }

    const audio = dealerBlackjackAudioRef.current;

    // รอ delay ก่อนแล้วค่อยเล่นเสียง
    setTimeout(() => {
      audio.pause();
      audio.currentTime = DEALER_BLACKJACK_SOUND_START_AT_SECONDS;
      audio.volume = getScaledVolume(DEALER_BLACKJACK_SOUND_GAIN);
      void audio.play().catch(() => {
        // Ignore browser/media playback errors.
      });

      // หยุดเสียงหลัง 3 วินาที
      setTimeout(() => {
        if (dealerBlackjackAudioRef.current) {
          dealerBlackjackAudioRef.current.pause();
        }
      }, 3000);
    }, DEALER_BLACKJACK_SOUND_DELAY_MS);
  }, []);

  useEffect(() => {
    const pool = Array.from({ length: 4 }, () => {
      const audio = new Audio(CARD_DRAW_SOUND_SRC);
      audio.preload = "auto";
      audio.load();
      return audio;
    });
    cardDrawAudioPoolRef.current = pool;

    return () => {
      for (const audio of cardDrawAudioPoolRef.current) {
        audio.pause();
      }
      cardDrawAudioPoolRef.current = [];
    };
  }, []);

  useEffect(() => {
    const audio = new Audio(BLACKJACK_LOSE_SOUND_SRC);
    audio.preload = "auto";
    audio.load();
    blackjackLoseAudioRef.current = audio;

    return () => {
      blackjackLoseAudioRef.current?.pause();
      blackjackLoseAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = new Audio(BLACKJACK_WIN_SOUND_SRC);
    audio.preload = "auto";
    audio.load();
    blackjackWinAudioRef.current = audio;

    return () => {
      blackjackWinAudioRef.current?.pause();
      blackjackWinAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = new Audio(DEALER_BLACKJACK_SOUND_SRC);
    audio.preload = "auto";
    audio.load();
    dealerBlackjackAudioRef.current = audio;

    return () => {
      dealerBlackjackAudioRef.current?.pause();
      dealerBlackjackAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    betRef.current = bet;
  }, [bet]);

  useEffect(() => {
    playerChipsRef.current = playerChips;
  }, [playerChips]);

  useEffect(() => {
    if (gameStatus === "betting") {
      prevPlayerCardCountRef.current = playerHand.length;
      prevDealerCardCountRef.current = dealerHand.length;
      return;
    }

    const playerDiff = playerHand.length - prevPlayerCardCountRef.current;
    const dealerDiff = dealerHand.length - prevDealerCardCountRef.current;
    const drawCount = Math.max(playerDiff, 0) + Math.max(dealerDiff, 0);

    for (let i = 0; i < drawCount; i++) {
      window.setTimeout(() => {
        playCardDrawSound();
      }, i * 40);
    }

    prevPlayerCardCountRef.current = playerHand.length;
    prevDealerCardCountRef.current = dealerHand.length;
  }, [dealerHand.length, gameStatus, playCardDrawSound, playerHand.length]);

  useEffect(() => {
    const lower = result.toLowerCase();
    if (lower.includes("blackjack") && lower.includes("dealer")) {
      playBlackjackLoseSound();
    }
  }, [playBlackjackLoseSound, result]);

  useEffect(() => {
    const syncSkins = () => {
      setCardSkin(getCardSkin());
      setChipSkin(getChipSkin());
      setTableSkin(getTableSkin());
    };

    syncSkins();

    const handleStorageChange = (event: Event) => {
      const storageEvent = event as CustomEvent<{ key?: string }>;
      const key = storageEvent.detail?.key;
      if (!key || key === "cardSkin" || key === "chipSkin" || key === "tableSkin") {
        syncSkins();
      }
    };

    window.addEventListener("local-storage-change", handleStorageChange);
    return () => window.removeEventListener("local-storage-change", handleStorageChange);
  }, []);

  const getChipStacks = (amount: number): ChipStack[] => {
    const chipValues = [1000, 500, 100, 25, 10, 5, 1];
    let remaining = Math.max(0, Math.floor(amount));
    const stacks: ChipStack[] = [];
    for (const value of chipValues) {
      if (remaining < value) continue;
      const count = Math.floor(remaining / value);
      remaining -= count * value;
      stacks.push({ value, count, image: getChipImage(value, chipSkin) });
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
      setIsAdmin(user.role === "admin");

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
        standResolveRef.current = false;
        stopTimer();
        setPlayerHand(data.playerHand);
        setIsBlackjackResult(false);
        setRoundPayout(-betRef.current);
        setResult("BUST! Dealer wins");
        setGameStatus("game-over");
        setDealerRevealIndex(null);
        setIsDealerDrawing(false);
        setIsLoading(false);
      });

      socket.on(
        "game:finished",
        async (data: { playerHand: Card[]; dealerHand: Card[]; playerValue: number; dealerValue: number; result: "win" | "lose" | "draw"; reward: number; balance?: number; coins?: number }) => {
          stopTimer();
          setPlayerHand(data.playerHand);
          const msg = data.result === "win" ? "You win! 🎉" : data.result === "draw" ? "Draw!" : "Dealer wins";
          const nextChips = typeof data.balance === "number" ? data.balance : typeof data.coins === "number" ? data.coins : playerChipsRef.current;

          if (standResolveRef.current) {
            standResolveRef.current = false;
            setResult("");

            const finalDealerHand = data.dealerHand;

            if (finalDealerHand.length >= 2) {
              setDealerHand(finalDealerHand.slice(0, 2));
              setDealerRevealIndex(1);
              await wait(650);
              await wait(300);
            } else {
              setDealerHand(finalDealerHand);
            }

            if (finalDealerHand.length > 2) {
              setIsDealerDrawing(true);
              for (let i = 3; i <= finalDealerHand.length; i++) {
                setDealerHand(finalDealerHand.slice(0, i));
                await wait(420);
              }
              setIsDealerDrawing(false);
            }

            await wait(240);
            setIsBlackjackResult(false);
            setRoundPayout(data.reward - betRef.current);
            setResult(msg);
            setPlayerChips(nextChips);
            LocalStorage.setItem("coins", nextChips.toString());
            setGameStatus("game-over");
            setIsLoading(false);
            return;
          }

          setDealerRevealIndex(null);
          setIsDealerDrawing(false);
          setDealerHand(data.dealerHand);
          setIsBlackjackResult(false);
          setRoundPayout(data.reward - betRef.current);
          setResult(msg);
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
      for (const audio of cardDrawAudioPoolRef.current) {
        audio.pause();
      }
      cardDrawAudioPoolRef.current = [];
      blackjackLoseAudioRef.current?.pause();
      blackjackLoseAudioRef.current = null;
      blackjackWinAudioRef.current?.pause();
      blackjackWinAudioRef.current = null;
      dealerBlackjackAudioRef.current?.pause();
      dealerBlackjackAudioRef.current = null;
      socketRef.current?.disconnect();
    };
  }, [router]);

  const popupType: PopupType | null = useMemo(() => {
    if (!result) return null;
    const lower = result.toLowerCase();
    if (lower.includes("you win")) return "win";
    else if (lower.includes("draw")) return "draw";
    else if (lower.includes("lose") || lower.includes("dealer wins") || lower.includes("bust")) return "lose";
    return null;
  }, [result]);

  useEffect(() => {
    if (popupType === "win") {
      playBlackjackWinSound();
    } else if (popupType === "lose") {
      if (result.includes("Dealer Blackjack")) {
        playDealerBlackjackSound();
      } else {
        playBlackjackLoseSound();
      }
    } else if (popupType === "draw") {
      playBlackjackDrawSound();
    }
  }, [popupType, playBlackjackLoseSound, playBlackjackWinSound, playBlackjackDrawSound, playDealerBlackjackSound, result]);

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
      betRef.current = ack.bet;
      const nextChips = typeof ack?.balance === "number" ? ack.balance : typeof ack?.coins === "number" ? ack.coins : playerChips;
      setPlayerChips(nextChips);
      LocalStorage.setItem("coins", nextChips.toString());
      setMessage("");

      // Blackjack on initial deal — game is already over
      if (ack.result !== undefined) {
        const msg = ack.result === "win" ? (ack.blackjack ? "Blackjack! 🎉 You win!" : "You win! 🎉") : ack.result === "draw" ? "Draw! Both Blackjack" : "Dealer Blackjack — Dealer wins";
        const reward = typeof ack.reward === "number" ? ack.reward : 0;
        setIsBlackjackResult(true);
        setRoundPayout(reward - ack.bet);
        setResult(msg);
        setGameStatus("game-over");
        setDealerRevealIndex(null);
        setIsDealerDrawing(false);
        stopTimer();
      } else {
        setIsBlackjackResult(false);
        setRoundPayout(0);
        setResult("");
        setGameStatus("playing");
        setDealerRevealIndex(null);
        setIsDealerDrawing(false);
        standResolveRef.current = false;
        startTimer();
      }
    });
  };

  const hit = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return;
    setIsLoading(true);
    const payload: { gameId: number; userId: number; forcedCard?: ForcedCardPayload } = { gameId, userId };
    if (isAdmin && forceNextHitCard) {
      payload.forcedCard = { suit: forcedSuit, rank: forcedRank };
    }

    socketRef.current.emit("game:hit", payload, (ack: GameActionAck) => {
      setIsLoading(false);
      if (!ack?.ok) {
        setMessage(ack?.message || "Failed to hit");
        return;
      }
      if (isAdmin && forceNextHitCard) {
        setForceNextHitCard(false);
      }
      setPlayerHand(ack.playerHand);
      if (ack.bust) {
        stopTimer();
        setIsBlackjackResult(false);
        setRoundPayout(-bet);
        setResult("BUST! Dealer wins");
        setGameStatus("game-over");
        setDealerRevealIndex(null);
        setIsDealerDrawing(false);
      } else if (ack.result !== undefined) {
        // Player hit exactly 21 — dealer resolved automatically
        stopTimer();
        if (ack.dealerHand) setDealerHand(ack.dealerHand);
        const msg = ack.result === "win" ? "You win! 🎉" : ack.result === "draw" ? "Draw!" : "Dealer wins";
        const reward = typeof ack.reward === "number" ? ack.reward : ack.result === "draw" ? bet : ack.result === "win" ? bet * 2 : 0;
        setIsBlackjackResult(false);
        setRoundPayout(reward - bet);
        setResult(msg);
        const nextChips = typeof ack.balance === "number" ? ack.balance : typeof ack.coins === "number" ? ack.coins : playerChips;
        setPlayerChips(nextChips);
        LocalStorage.setItem("coins", nextChips.toString());
        setGameStatus("game-over");
        setDealerRevealIndex(null);
        setIsDealerDrawing(false);
      } else {
        startTimer();
      }
    });
  };

  const stand = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return;
    setIsLoading(true);
    stopTimer();
    standResolveRef.current = true;
    socketRef.current.emit("game:stand", { gameId, userId }, (ack: GameActionAck) => {
      if (!ack?.ok) {
        standResolveRef.current = false;
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
  const payoutPrefix = roundPayout > 0 ? "+" : "";
  const resultClassName = result.includes("win") ? styles.resultWin : result.includes("Draw") ? styles.resultDraw : styles.resultLose;

  const getDealerDealStyle = (cardIndex: number): CSSProperties => ({
    animationDelay: `${cardIndex * 0.12}s`,
  });

  const getPlayerDealStyle = (cardIndex: number): CSSProperties => ({
    animationDelay: gameStatus === "playing" && cardIndex >= 2 ? "0.02s" : `${cardIndex * 0.12 + 0.08}s`,
  });

  const getCardSlotStyle = (cardIndex: number, totalCards: number, spacing = 95): CSSProperties =>
    ({
      ["--card-offset" as string]: `${(cardIndex - (totalCards - 1) / 2) * spacing}px`,
      zIndex: cardIndex + 1,
    }) as CSSProperties;

  return (
    <div className={styles.page}>
      <Navbar disabled />
      <div className={styles.main}>
        <div className={styles.tableWrap}>
          {gameStatus === "betting" && (
            <button type="button" onClick={() => router.push("/play")} className={styles.backButton}>
              ← Back
            </button>
          )}
          <button type="button" className={styles.tutorialButton} onClick={() => setIsTutorialOpen(true)}>
            ?
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
                  <div key={i} className={styles.cardSlot} style={getCardSlotStyle(i, dealerHand.length, 108)}>
                    <div
                      className={`${styles.cardFrame} ${dealerRevealIndex === i ? "" : styles.dealCard} ${styles.dealToDealer} ${dealerRevealIndex === i ? styles.cardFlip : ""}`.trim()}
                      style={getDealerDealStyle(i)}>
                      <Image src={getCardImage(card, cardSkin)} alt={`${card.rank}${card.suit}`} width={85} height={125} unoptimized className={styles.cardImage} />
                    </div>
                  </div>
                ))}
              {gameStatus === "playing" && dealerRevealIndex === null && !isDealerDrawing && dealerHand.length < 2 && (
                <div className={styles.cardSlot} style={getCardSlotStyle(dealerHand.length, dealerHand.length + 1, 108)}>
                  <div className={`${styles.cardFrame} ${styles.dealCard} ${styles.dealToDealer}`.trim()} style={getDealerDealStyle(dealerHand.length)}>
                    <Image src={getCardBackImage(cardSkin)} alt="Card back" width={85} height={125} unoptimized className={styles.cardImage} />
                  </div>
                </div>
              )}
            </div>

            {gameStatus !== "betting" && (
              <div className={`${styles.scoreWrap} ${styles.dealerScoreWrap}`}>
                <div className={styles.scoreBadge}>{gameStatus === "playing" ? dealerHand.reduce((acc, c) => acc + c.value, 0) : dealerValue}</div>
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
                  <div key={i} className={styles.cardSlot} style={getCardSlotStyle(i, playerHand.length)}>
                    <div className={`${styles.cardFrame} ${styles.dealCard} ${styles.dealToPlayer}`.trim()} style={getPlayerDealStyle(i)}>
                      <Image src={getCardImage(card, cardSkin)} alt={`${card.rank}${card.suit}`} width={85} height={125} unoptimized className={styles.cardImage} />
                    </div>
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
                        <Image src={getChipImage(v, chipSkin)} alt={`${v}`} width={52} height={52} unoptimized className={styles.chipButtonImage} />
                      </button>
                    ))}
                  </div>
                </div>
                {message && <p className={styles.inlineError}>{message}</p>}
              </div>
            )}
          </div>
          {result && !popupType && <div className={`${styles.resultBadge} ${resultClassName}`.trim()}>{result}</div>}

          {popupType === "win" && (
            <div className={styles.winOverlay}>
              <div className={styles.winContentFull}>
                <h1 className={styles.winTitle}>{isBlackjackResult ? "Blackjack!" : "You Win!"}</h1>

                <div className={styles.winContent}>
                  <p>Your Score: {playerValue}</p>
                  <p>Opponent Score: {dealerValue}</p>
                  <p>Bet: {bet} coins</p>
                  <p>Result: {payoutPrefix}{roundPayout} coins</p>

                  <div className={styles.divider}></div>

                  <p>Current Balance: {playerChips.toLocaleString()} coin</p>
                  <div className={styles.divider}></div>
                </div>

                <div className={styles.winButtons}>
                  <button onClick={() => router.push("/play")}>BACK TO LOBBY</button>

                  <button
                    onClick={() => {
                      setGameStatus("betting");
                      setPlayerHand([]);
                      setDealerHand([]);
                      setIsBlackjackResult(false);
                      setRoundPayout(0);
                      setResult("");
                      setMessage("");
                      setPendingBet(0);
                      setDealerRevealIndex(null);
                      setIsDealerDrawing(false);
                      standResolveRef.current = false;
                    }}>
                    PLAY AGAIN
                  </button>
                </div>
              </div>
            </div>
          )}

          {popupType === "lose" && (
            <div className={styles.winOverlay}>
              <div className={styles.winContentFull}>
                <h1 className={styles.loseTitle}>{isBlackjackResult ? "Dealer Blackjack" : "You Lose"}</h1>

                <div className={styles.winContent}>
                  <p>Your Score: {playerValue}</p>
                  <p>Opponent Score: {dealerValue}</p>
                  <p>Bet: {bet} coins</p>
                  <p>Result: {payoutPrefix}{roundPayout} coins</p>

                  <div className={styles.divider}></div>

                  <p>Current Balance: {playerChips.toLocaleString()} coin</p>
                </div>

                <div className={styles.winButtons}>
                  <button onClick={() => router.push("/play")}>BACK TO LOBBY</button>

                  <button
                    onClick={() => {
                      setGameStatus("betting");
                      setPlayerHand([]);
                      setDealerHand([]);
                      setIsBlackjackResult(false);
                      setRoundPayout(0);
                      setResult("");
                      setMessage("");
                      setPendingBet(0);
                      setDealerRevealIndex(null);
                      setIsDealerDrawing(false);
                      standResolveRef.current = false;
                    }}>
                    PLAY AGAIN
                  </button>
                </div>
              </div>
            </div>
          )}

          {popupType === "draw" && (
            <div className={styles.winOverlay}>
              <div className={styles.winContentFull}>
                <h1 className={styles.drawTitle}>{isBlackjackResult ? "Both Blackjack" : "Draw"}</h1>

                <div className={styles.winContent}>
                  <p>Your Score: {playerValue}</p>
                  <p>Opponent Score: {dealerValue}</p>
                  <p>Bet: {bet} coins</p>
                  <p>Result: {payoutPrefix}{roundPayout} coins</p>

                  <div className={styles.divider}></div>

                  <p>Current Balance: {playerChips.toLocaleString()} coin</p>
                </div>

                <div className={styles.winButtons}>
                  <button onClick={() => router.push("/play")}>BACK TO LOBBY</button>

                  <button
                    onClick={() => {
                      setGameStatus("betting");
                      setPlayerHand([]);
                      setDealerHand([]);
                      setIsBlackjackResult(false);
                      setRoundPayout(0);
                      setResult("");
                      setMessage("");
                      setPendingBet(0);
                      setDealerRevealIndex(null);
                      setIsDealerDrawing(false);
                      standResolveRef.current = false;
                    }}>
                    PLAY AGAIN
                  </button>
                </div>
              </div>
            </div>
          )}

          {isTutorialOpen && (
            <div className={styles.tutorialOverlay} onClick={() => setIsTutorialOpen(false)}>
              <div className={styles.tutorialModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.tutorialModalHeader}>
                  <h2 className={styles.tutorialModalTitle}>วิธีการเล่น</h2>
                  <button type="button" className={styles.tutorialModalClose} onClick={() => setIsTutorialOpen(false)}>
                    ×
                  </button>
                </div>
                <div className={styles.tutorialModalBody}>
                  <p><strong>กฏ</strong></p>
                  <p>ใช้ไพ่ 1–8 สำรับ (52 ใบต่อสำรับ)</p>
                  <p>ผู้เล่นแต่ละคนจะได้ไพ่ 2 ใบ</p>
                  <p>ดีลเลอร์ก็ได้ไพ่ 2 ใบ (มักจะเปิด 1 ใบ คว่ำ 1 ใบ)</p>
                  
                  <p><strong>วิธีการนับเลขไพ่</strong></p>
                  <p>ไพ่ 2–10 = ตามตัวเลข</p>
                  <p>ไพ่ J, Q, K = 10 แต้ม</p>
                  <p>ไพ่ A = 1 หรือ 11 แต้ม (เลือกให้ได้เปรียบที่สุด)</p>

                  <p><strong>วิธีการเล่น</strong></p>
                  <p>1. ผู้เล่นวางเดิมพัน</p>
                  <p>2. แจกไพ่คนละ 2 ใบ</p>
                  <p>3. ผู้เล่นเลือกการกระทำ:</p>
                  <p>&nbsp;&nbsp;• Hit = ขอไพ่เพิ่ม</p>
                  <p>&nbsp;&nbsp;• Stand = หยุด ไม่รับเพิ่ม</p>
                  <p>&nbsp;&nbsp;• Double Down = เพิ่มเดิมพัน 2 เท่า แล้วจั่วได้อีก 1 ใบเท่านั้น</p>
                  <p>&nbsp;&nbsp;• Split = ถ้าได้ไพ่ 2 ใบเหมือนกัน แยกเป็น 2 มือ</p>
                  <p>4. เมื่อผู้เล่นครบแล้ว ดีลเลอร์จะเปิดไพ่และเล่นตามกติกา</p>
                  <p>5. ต้องจั่วจนแต้มอย่างน้อย 17</p>
                  <p>6. เปรียบเทียบแต้ม ใครใกล้ 21 มากกว่าชนะ</p>
                </div>
              </div>
            </div>
          )}

          {isAdmin && gameStatus === "playing" && (
            <div className={styles.adminHitDock}>
              <button type="button" className={styles.adminHitDropdownButton} onClick={() => setIsAdminHitDropdownOpen((prev) => !prev)}>
                Admin Hit Control {isAdminHitDropdownOpen ? "▴" : "▾"}
              </button>

              {isAdminHitDropdownOpen && (
                <div className={styles.adminHitPanel}>
                  <label className={styles.adminToggleRow}>
                    <input type="checkbox" checked={forceNextHitCard} onChange={(e) => setForceNextHitCard(e.target.checked)} />
                    Force next hit card
                  </label>
                  <div className={styles.adminSelectRow}>
                    <select className={styles.adminSelect} value={forcedRank} onChange={(e) => setForcedRank(e.target.value)}>
                      {FORCED_CARD_RANKS.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </select>
                    <select className={styles.adminSelect} value={forcedSuit} onChange={(e) => setForcedSuit(e.target.value)}>
                      {FORCED_CARD_SUITS.map((suit) => (
                        <option key={suit} value={suit}>
                          {suit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
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
            <>
              <div className={`${styles.controlsRow} ${styles.playingRow}`.trim()}>
                <button onClick={hit} disabled={isLoading} className={`${styles.controlButton} ${styles.hitButton}`.trim()}>
                  HIT
                </button>
                <button onClick={stand} disabled={isLoading} className={`${styles.controlButton} ${styles.standButton}`.trim()}>
                  STAND
                </button>
              </div>
            </>
          )}

          {message && gameStatus !== "betting" && <p className={styles.bottomMessage}>{message}</p>}
        </div>
      </div>
    </div>
  );
}
