"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import config from "../../../../config"
import { io, Socket } from "socket.io-client"
import { getCardImagePath, getCardBackImage } from "../../../utils/cardUtils"

interface Card {
  suit: string
  rank: string
  value: number
}

interface ChipStack {
  value: number
  count: number
  image: string
}

type GameStatus = "betting" | "playing" | "game-over"

const CHIP_VALUES = [1, 5, 10, 25, 100, 500, 1000]
const CHIP_IMAGES: Record<number, string> = {
  1000: "/chips/chips1000.png",
  500: "/chips/chip500.png",
  100: "/chips/chip100.png",
  25: "/chips/chip25.png",
  10: "/chips/chip10.png",
  5: "/chips/chip5.png",
  1: "/chips/chip1.png",
}

const styles = `
  @keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(-40px) scale(0.85); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  @keyframes cardFlip {
    0%   { transform: rotateY(0deg)  scale(1);   }
    50%  { transform: rotateY(90deg) scale(1.08); }
    100% { transform: rotateY(0deg)  scale(1);   }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1);   }
  }
  .card      { animation: cardSlideIn 0.45s ease-out; }
  .card-flip { animation: cardFlip 0.6s ease-in-out; }
  .card-back { animation: cardSlideIn 0.45s ease-out; }
  .result-badge { animation: fadeIn 0.4s ease-out; }

  .chip-btn {
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 0.15s;
    padding: 0;
  }
  .chip-btn:hover { transform: translateY(-6px) scale(1.12); }
  .chip-btn:active { transform: scale(0.95); }
`

export default function Dealer() {
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const [gameStatus, setGameStatus] = useState<GameStatus>("betting")
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [bet, setBet] = useState<number>(0)
  const [pendingBet, setPendingBet] = useState<number>(0)
  const [playerChips, setPlayerChips] = useState<number>(0)
  const [message, setMessage] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const [gameId, setGameId] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<number>(0)
  const [username, setUsername] = useState<string>("username")
  const [timer, setTimer] = useState<number>(10)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getAvatarColor = (name: string) => {
    const colors = [
      "#e05c5c", "#e0885c", "#d4a632", "#6db86d",
      "#5cb8b8", "#5c8ae0", "#8e5ce0", "#c05ce0",
      "#e05c9a", "#4ca8c8"
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getChipStacks = (amount: number): ChipStack[] => {
    const chipValues = [1000, 500, 100, 25, 10, 5, 1]
    let remaining = Math.max(0, Math.floor(amount))
    const stacks: ChipStack[] = []
    for (const value of chipValues) {
      if (remaining < value) continue
      const count = Math.floor(remaining / value)
      remaining -= count * value
      stacks.push({ value, count, image: CHIP_IMAGES[value] ?? "/chips/chip1.png" })
    }
    return stacks
  }

  const startTimer = () => {
    setTimer(10)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const calculateHandValue = (hand: Card[]) => {
    let value = 0
    let aces = 0
    for (const card of hand) {
      value += card.value
      if (card.rank === "A") aces++
    }
    while (value > 21 && aces > 0) { value -= 10; aces-- }
    return value
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) { router.push("/auth"); return }

    const cachedCoins = localStorage.getItem("cached_coins")
    if (cachedCoins) setPlayerChips(Number(cachedCoins))

    ;(async () => {
      try {
        const res = await fetch(`${config.apiUrl}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUserId(data.id)
          setUsername(data.username || data.name || "username")
          setPlayerChips(data.coins ?? Number(cachedCoins ?? 0))
          localStorage.setItem("userId", data.id.toString())
        }
      } catch { /* ignore */ }
    })()

    const socket = io(config.socketUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token },
    })

    socket.on("connect", () => console.log("Socket connected"))

    socket.on("game:player-hit", (data: { playerHand: Card[]; playerValue: number }) => {
      setPlayerHand(data.playerHand)
      startTimer()
    })

    socket.on("game:bust", (data: { playerHand: Card[]; playerValue: number }) => {
      stopTimer()
      setPlayerHand(data.playerHand)
      setResult("BUST! Dealer wins")
      setGameStatus("game-over")
      setIsLoading(false)
    })

    socket.on("game:finished", (data: {
      playerHand: Card[]
      dealerHand: Card[]
      playerValue: number
      dealerValue: number
      result: "win" | "lose" | "push"
      reward: number
      balance?: number
      coins?: number
    }) => {
      stopTimer()
      setPlayerHand(data.playerHand)
      setDealerHand(data.dealerHand)
      const msg = data.result === "win" ? "You win! 🎉" : data.result === "push" ? "Push!" : "Dealer wins"
      setResult(msg)
      const nextChips = typeof data.balance === "number"
        ? data.balance
        : typeof data.coins === "number"
          ? data.coins
          : playerChips
      setPlayerChips(nextChips)
      localStorage.setItem("cached_coins", nextChips.toString())
      setGameStatus("game-over")
      setIsLoading(false)
    })

    socket.on("disconnect", () => console.log("Socket disconnected"))

    socketRef.current = socket
    return () => { stopTimer(); socketRef.current?.disconnect() }
  }, [])

  const startGame = (betAmount: number) => {
    if (betAmount <= 0 || betAmount > playerChips) {
      setMessage("Invalid bet amount")
      return
    }
    if (!socketRef.current) { setMessage("Not connected"); return }
    if (!userId) { setMessage("User not loaded yet, please wait"); return }

    setIsLoading(true)
    socketRef.current.emit(
      "game:start",
      { userId, gameType: "quick_ai", bet: betAmount },
      (ack: any) => {
        setIsLoading(false)
        if (!ack?.ok) { setMessage(ack?.message || "Failed to start game"); return }
        setGameId(ack.gameId)
        setPlayerHand(ack.playerHand)
        setDealerHand(ack.dealerHand)
        setBet(ack.bet)
        const nextChips = typeof ack?.balance === "number"
          ? ack.balance
          : typeof ack?.coins === "number"
            ? ack.coins
            : playerChips
        setPlayerChips(nextChips)
        localStorage.setItem("cached_coins", nextChips.toString())
        setMessage("")

        // Blackjack on initial deal — game is already over
        if (ack.result !== undefined) {
          const msg = ack.result === "win"
            ? (ack.blackjack ? "Blackjack! 🎉 You win!" : "You win! 🎉")
            : ack.result === "push" ? "Push! Both Blackjack" : "Dealer Blackjack — Dealer wins"
          setResult(msg)
          setGameStatus("game-over")
          stopTimer()
        } else {
          setResult("")
          setGameStatus("playing")
          startTimer()
        }
      }
    )
  }

  const hit = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return
    setIsLoading(true)
    socketRef.current.emit("game:hit", { gameId, userId }, (ack: any) => {
      setIsLoading(false)
      if (!ack?.ok) { setMessage(ack?.message || "Failed to hit"); return }
      setPlayerHand(ack.playerHand)
      if (ack.bust) {
        stopTimer()
        setResult("BUST! Dealer wins")
        setGameStatus("game-over")
      } else if (ack.result !== undefined) {
        // Player hit exactly 21 — dealer resolved automatically
        stopTimer()
        if (ack.dealerHand) setDealerHand(ack.dealerHand)
        const msg = ack.result === "win" ? "You win! 🎉" : ack.result === "push" ? "Push!" : "Dealer wins"
        setResult(msg)
        const nextChips = typeof ack.balance === "number" ? ack.balance : typeof ack.coins === "number" ? ack.coins : playerChips
        setPlayerChips(nextChips)
        localStorage.setItem("cached_coins", nextChips.toString())
        setGameStatus("game-over")
      } else {
        startTimer()
      }
    })
  }

  const stand = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return
    setIsLoading(true)
    stopTimer()
    socketRef.current.emit("game:stand", { gameId, userId }, (ack: any) => {
      if (!ack?.ok) { setIsLoading(false); setMessage(ack?.message || "Failed to stand") }
    })
  }

  const addChipToBet = (value: number) => {
    if (pendingBet + value > playerChips) return
    setPendingBet(prev => prev + value)
    setMessage("")
  }

  const clearBet = () => setPendingBet(0)

  const playerValue = calculateHandValue(playerHand)
  const dealerValue = calculateHandValue(dealerHand)
  const chipStacks = getChipStacks(bet)

  return (
    <div style={{ background: "#111827", minHeight: "100vh", color: "white", fontFamily: "'Inter', 'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{styles}</style>

      {/* ─── Header ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
      }}>
        {/* Avatar + username */}
        <div
          onClick={() => {
            if (socketRef.current && gameId) socketRef.current.emit("game:leave", { gameId, userId })
            router.push("/play")
          }}
          style={{ display: "flex", alignItems: "center", gap: "12px", background: "#1f2937", borderRadius: "50px", padding: "6px 18px 6px 6px", cursor: "pointer" }}
        >
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: getAvatarColor(username), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "16px", color: "white", userSelect: "none" }}>{username ? username[0].toUpperCase() : "?"}</div>
          <span style={{ fontWeight: 600, fontSize: "15px" }}>{username}</span>
        </div>

        {/* Balances */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Coins */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1f2937", borderRadius: "50px", padding: "8px 20px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "#78350f" }}>C</div>
            <span style={{ fontWeight: 700, fontSize: "15px" }}>{playerChips.toLocaleString()}</span>
          </div>
          {/* Tokens */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#374151", borderRadius: "50px", padding: "8px 16px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "white" }}>T</div>
            <span style={{ fontWeight: 700, fontSize: "15px" }}>0</span>
            <span style={{ fontSize: "18px", color: "#9ca3af", marginLeft: "2px", cursor: "pointer" }}>+</span>
          </div>
        </div>
      </div>

      {/* ─── Main Game Area ─── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "10px" }}>

        {/* ── Semicircular Table ── */}
        <div style={{ position: "relative", width: "820px", maxWidth: "98vw" }}>

          {/* Table shape */}
          <div style={{
            width: "820px",
            maxWidth: "98vw",
            height: "460px",
            background: "#c8922a",
            borderRadius: "0 0 430px 430px / 0 0 460px 460px",
            boxShadow: "0 0 0 10px #e8b84b, 0 8px 40px rgba(0,0,0,0.6)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Inner felt shadow */}
            <div style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              boxShadow: "inset 0 -30px 60px rgba(0,0,0,0.15)",
              pointerEvents: "none",
            }} />

            {/* ── Chip Stack (right side) ── */}
            {gameStatus !== "betting" && (
              <div style={{
                position: "absolute",
                right: "60px",
                top: "50px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0",
              }}>
                {/* stacked chips visual */}
                <div style={{ position: "relative", width: "90px", height: "140px" }}>
                  {chipStacks.map((stack, si) => (
                    Array.from({ length: Math.min(stack.count, 4) }).map((_, ci) => (
                      <img
                        key={`${si}-${ci}`}
                        src={stack.image}
                        alt={`${stack.value}`}
                        style={{
                          position: "absolute",
                          bottom: `${(si * 20) + ci * 5}px`,
                          left: `${si % 2 === 0 ? 0 : 20}px`,
                          width: "60px",
                          height: "60px",
                          objectFit: "contain",
                          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.4))",
                        }}
                      />
                    ))
                  ))}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,0.6)", marginTop: "4px" }}>Bet: {bet}</span>
              </div>
            )}

            {/* ── Dealer Hand ── */}
            <div style={{
              position: "absolute",
              top: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              justifyContent: "center",
            }}>
              {gameStatus !== "betting" && dealerHand.map((card, i) => (
                <div key={i} className={gameStatus === "game-over" ? "card card-flip" : "card"}
                  style={{ width: "85px", height: "125px" }}>
                  <img src={getCardImagePath(card)} alt={`${card.rank}${card.suit}`}
                    style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "fill", boxShadow: "0 4px 14px rgba(0,0,0,0.45)" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='85' height='125'%3E%3Crect fill='%23fff' width='85' height='125'/%3E%3C/svg%3E" }}
                  />
                </div>
              ))}
              {gameStatus === "playing" && (
                <div className="card-back" style={{ width: "85px", height: "125px" }}>
                  <img src={getCardBackImage(1)} alt="Card back"
                    style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "fill", boxShadow: "0 4px 14px rgba(0,0,0,0.45)" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='85' height='125'%3E%3Crect fill='%231a40b0' width='85' height='125'/%3E%3C/svg%3E" }}
                  />
                </div>
              )}
            </div>

            {/* ── Dealer score badge + timer ── */}
            {gameStatus !== "betting" && (
              <div style={{
                position: "absolute",
                top: "168px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "50%",
                  background: "rgba(100,100,100,0.75)", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "17px", color: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}>
                  {gameStatus === "playing" ? dealerHand.reduce((acc,c) => acc + c.value,0) : dealerValue}
                </div>
                {gameStatus === "playing" && (
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.6)" }}>{timer} s</span>
                )}
              </div>
            )}

            {/* ── Player score badge ── */}
            {gameStatus !== "betting" && (
              <div style={{
                position: "absolute",
                top: "240px",
                left: "50%",
                transform: "translateX(-50%)",
              }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "50%",
                  background: "rgba(100,100,100,0.75)", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "17px", color: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}>
                  {playerValue}
                </div>
              </div>
            )}

            {/* ── Player Hand ── */}
            <div style={{
              position: "absolute",
              bottom: "50px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              justifyContent: "center",
            }}>
              {gameStatus !== "betting" && playerHand.map((card, i) => (
                <div key={i} className="card" style={{ width: "85px", height: "125px" }}>
                  <img src={getCardImagePath(card)} alt={`${card.rank}${card.suit}`}
                    style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "fill", boxShadow: "0 4px 14px rgba(0,0,0,0.45)" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='85' height='125'%3E%3Crect fill='%23fff' width='85' height='125'/%3E%3C/svg%3E" }}
                  />
                </div>
              ))}
            </div>

            {/* ── Betting phase overlay on table ── */}
            {gameStatus === "betting" && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                borderRadius: "inherit",
              }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "22px", color: "rgba(0,0,0,0.55)", letterSpacing: "1px" }}>PLACE YOUR BET</p>
                <div style={{
                  background: "rgba(0,0,0,0.2)", borderRadius: "12px",
                  padding: "10px 24px", fontWeight: 800, fontSize: "28px", color: "rgba(0,0,0,0.7)", minWidth: "120px", textAlign: "center",
                }}>
                  {pendingBet > 0 ? pendingBet.toLocaleString() : "—"}
                </div>
                {/* Chips row */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                  {CHIP_VALUES.map(v => (
                    <button key={v} className="chip-btn" onClick={() => addChipToBet(v)} title={`+${v}`}>
                      <img src={CHIP_IMAGES[v]} alt={`${v}`} style={{ width: "52px", height: "52px", objectFit: "contain" }} />
                    </button>
                  ))}
                </div>
                {message && <p style={{ margin: 0, color: "#dc2626", fontSize: "13px", fontWeight: 600 }}>{message}</p>}
              </div>
            )}

            {/* ── Result badge ── */}
            {result && (
              <div className="result-badge" style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                background: result.includes("win") ? "rgba(16,185,129,0.92)" : result.includes("Push") ? "rgba(245,158,11,0.92)" : "rgba(239,68,68,0.92)",
                borderRadius: "16px",
                padding: "18px 40px",
                fontWeight: 800, fontSize: "22px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                whiteSpace: "nowrap",
              }}>
                {result}
              </div>
            )}
          </div>
        </div>

        {/* ─── Controls below the table ─── */}
        <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>

          {/* Betting controls */}
          {gameStatus === "betting" && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={clearBet}
                style={{ padding: "12px 24px", fontSize: "15px", fontWeight: 700, background: "#374151", border: "none", color: "#d1d5db", cursor: "pointer", borderRadius: "10px", transition: "opacity 0.2s" }}
              >
                Clear
              </button>
              <button
                onClick={() => startGame(pendingBet)}
                disabled={isLoading || pendingBet <= 0}
                style={{
                  padding: "12px 44px", fontSize: "16px", fontWeight: 800,
                  background: pendingBet > 0 ? "#10b981" : "#374151",
                  border: "none", color: "white", cursor: pendingBet > 0 ? "pointer" : "not-allowed",
                  borderRadius: "10px", opacity: isLoading ? 0.6 : 1,
                  transition: "background 0.2s, transform 0.1s",
                  boxShadow: pendingBet > 0 ? "0 0 20px rgba(16,185,129,0.4)" : "none",
                }}
              >
                {isLoading ? "Dealing…" : "DEAL"}
              </button>
            </div>
          )}

          {/* Playing controls */}
          {gameStatus === "playing" && (
            <div style={{ display: "flex", gap: "14px" }}>
              <button
                onClick={hit}
                disabled={isLoading}
                style={{ padding: "14px 44px", fontSize: "17px", fontWeight: 800, background: "#3b82f6", border: "none", color: "white", cursor: "pointer", borderRadius: "12px", opacity: isLoading ? 0.5 : 1, boxShadow: "0 0 20px rgba(59,130,246,0.4)", transition: "transform 0.1s" }}
              >
                HIT
              </button>
              <button
                onClick={stand}
                disabled={isLoading}
                style={{ padding: "14px 44px", fontSize: "17px", fontWeight: 800, background: "#f97316", border: "none", color: "white", cursor: "pointer", borderRadius: "12px", opacity: isLoading ? 0.5 : 1, boxShadow: "0 0 20px rgba(249,115,22,0.4)", transition: "transform 0.1s" }}
              >
                STAND
              </button>
            </div>
          )}

          {/* Play Again */}
          {gameStatus === "game-over" && (
            <button
              onClick={() => { setGameStatus("betting"); setPlayerHand([]); setDealerHand([]); setResult(""); setMessage(""); setPendingBet(0) }}
              disabled={playerChips <= 0}
              style={{ padding: "14px 48px", fontSize: "17px", fontWeight: 800, background: "#10b981", border: "none", color: "white", cursor: "pointer", borderRadius: "12px", boxShadow: "0 0 24px rgba(16,185,129,0.45)" }}
            >
              {playerChips <= 0 ? "Out of chips!" : "Play Again"}
            </button>
          )}

          {message && gameStatus !== "betting" && (
            <p style={{ margin: 0, color: "#f87171", fontWeight: 600, fontSize: "14px" }}>{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
