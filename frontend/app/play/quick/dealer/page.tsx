"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import config from "../../../config"
import { io, Socket } from "socket.io-client"
import { getCardImagePath, getCardBackImage } from "../../../utils/cardUtils"

interface Card {
  suit: string
  rank: string
  value: number
}

type GameStatus = "betting" | "playing" | "game-over"

const styles = `
  @keyframes cardSlideIn {
    from {
      opacity: 0;
      transform: translateX(-100px) rotateY(90deg);
    }
    to {
      opacity: 1;
      transform: translateX(0) rotateY(0deg);
    }
  }

  @keyframes cardFlip {
    0% {
      transform: rotateY(0deg) scale(1);
    }
    50% {
      transform: rotateY(90deg) scale(1.1);
    }
    100% {
      transform: rotateY(0deg) scale(1);
    }
  }

  .card {
    animation: cardSlideIn 0.5s ease-out;
    perspective: 1000px;
  }

  .card-flip {
    animation: cardFlip 0.6s ease-in-out;
  }

  .card-back {
    animation: cardSlideIn 0.5s ease-out;
  }
`

export default function Dealer() {
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const [gameStatus, setGameStatus] = useState<GameStatus>("betting")
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [bet, setBet] = useState<number>(0)
  const [playerChips, setPlayerChips] = useState<number>(0)
  const [message, setMessage] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const [tempBet, setTempBet] = useState<string>("10")
  const [gameId, setGameId] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<number>(0)

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

    // fetch userId
    ;(async () => {
      try {
        const res = await fetch(`${config.apiUrl}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUserId(data.id)
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
    })

    socket.on("game:bust", (data: { playerHand: Card[]; playerValue: number }) => {
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
      coins: number
    }) => {
      setPlayerHand(data.playerHand)
      setDealerHand(data.dealerHand)
      const msg = data.result === "win" ? "You win!" : data.result === "push" ? "Push!" : "Dealer wins"
      setResult(msg)
      setPlayerChips(data.coins)
      localStorage.setItem("cached_coins", data.coins.toString())
      setGameStatus("game-over")
      setIsLoading(false)
    })

    socket.on("disconnect", () => console.log("Socket disconnected"))

    socketRef.current = socket
    return () => { socketRef.current?.disconnect() }
  }, [])

  const startGame = (betAmount: number) => {
    if (betAmount <= 0 || betAmount > playerChips) {
      setMessage("Invalid bet amount")
      return
    }
    if (!socketRef.current) {
      setMessage("Not connected")
      return
    }
    if (!userId) {
      setMessage("User not loaded yet, please wait")
      return
    }

    setIsLoading(true)
    socketRef.current.emit(
      "game:start",
      { userId, gameType: "quick_ai", bet: betAmount },
      (ack: any) => {
        setIsLoading(false)
        if (!ack?.ok) {
          setMessage(ack?.message || "Failed to start game")
          return
        }
        setGameId(ack.gameId)
        setPlayerHand(ack.playerHand)
        setDealerHand(ack.dealerHand)
        setBet(ack.bet)
        setPlayerChips(ack.coins)
        localStorage.setItem("cached_coins", ack.coins.toString())
        setGameStatus("playing")
        setMessage("")
        setResult("")
      }
    )
  }

  const hit = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return
    setIsLoading(true)
    socketRef.current.emit(
      "game:hit",
      { gameId, userId },
      (ack: any) => {
        setIsLoading(false)
        if (!ack?.ok) { setMessage(ack?.message || "Failed to hit"); return }
        setPlayerHand(ack.playerHand)
        if (ack.bust) {
          setResult("BUST! Dealer wins")
          setGameStatus("game-over")
        }
      }
    )
  }

  const stand = () => {
    if (isLoading || !socketRef.current || !gameId || !userId) return
    setIsLoading(true)
    socketRef.current.emit("game:stand", { gameId, userId }, (ack: any) => {
      if (!ack?.ok) {
        setIsLoading(false)
        setMessage(ack?.message || "Failed to stand")
      }
      // result handled by game:finished event
    })
  }

  const playerValue = calculateHandValue(playerHand)
  const dealerValue = calculateHandValue(dealerHand)

  return (
    <div style={{ background: "#2d5016", minHeight: "100vh", color: "white", padding: "20px" }}>
      <style>{styles}</style>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <button
          onClick={() => {
            if (socketRef.current && gameId) {
              socketRef.current.emit("game:leave", { gameId, userId })
            }
            router.push("/play")
          }}
          style={{ padding: "10px 20px", background: "#ff6b6b", border: "none", color: "white", cursor: "pointer", borderRadius: "5px" }}
          disabled={isLoading}
        >
          Back
        </button>
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>Chips: {playerChips}</div>
      </div>

      {/* Game Area */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {gameStatus === "betting" && (
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.3)", padding: "40px", borderRadius: "10px", marginTop: "100px" }}>
            <h2>Place Your Bet</h2>
            <input
              type="number"
              value={tempBet}
              onChange={(e) => setTempBet(e.target.value)}
              style={{ padding: "10px", fontSize: "16px", width: "100px", marginRight: "10px", borderRadius: "5px", border: "none" }}
              disabled={isLoading}
            />
            <button
              onClick={() => startGame(parseInt(tempBet))}
              style={{ padding: "10px 30px", fontSize: "16px", background: "#51cf66", border: "none", color: "white", cursor: "pointer", borderRadius: "5px", opacity: isLoading ? 0.5 : 1 }}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Deal"}
            </button>
            {message && <p style={{ color: "#ff6b6b" }}>{message}</p>}
          </div>
        )}

        {gameStatus !== "betting" && (
          <>
            {/* Dealer Hand */}
            <div style={{ marginBottom: "80px" }}>
              <h3>Dealer{gameStatus === "game-over" ? ` - Value: ${dealerValue}` : ""}</h3>
              <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "flex-start" }}>
                {dealerHand.map((card, i) => (
                  <div
                    key={i}
                    className={gameStatus === "game-over" ? "card card-flip" : "card"}
                    style={{
                      position: "relative",
                      width: "100px",
                      height: "150px",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={getCardImagePath(card)}
                      alt={`${card.rank}${card.suit}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5), 0 0 15px rgba(255,215,0,0.5)",
                        objectFit: "fill",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150'%3E%3Crect fill='%23fff' width='100' height='150'/%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                ))}
                {gameStatus === "playing" && (
                  <div
                    className="card-back"
                    style={{
                      width: "100px",
                      height: "150px",
                    }}
                  >
                    <img
                      src={getCardBackImage(1)}
                      alt="Card back"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5), 0 0 15px rgba(255,215,0,0.5)",
                        objectFit: "fill",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150'%3E%3Crect fill='%231a4010' width='100' height='150'/%3E%3Ctext x='50' y='75' font-size='60' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%82%A0%3C/text%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Player Hand */}
            <div style={{ marginBottom: "40px" }}>
              <h3>Your Hand - Value: {playerValue}</h3>
              <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "flex-start" }}>
                {playerHand.map((card, i) => (
                  <div
                    key={i}
                    className="card"
                    style={{
                      width: "100px",
                      height: "150px",
                    }}
                  >
                    <img
                      src={getCardImagePath(card)}
                      alt={`${card.rank}${card.suit}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5), 0 0 15px rgba(255,215,0,0.5)",
                        objectFit: "fill",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150'%3E%3Crect fill='%23fff' width='100' height='150'/%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Result */}
            {result && (
              <div style={{ textAlign: "center", background: result.includes("win") ? "rgba(81,207,102,0.3)" : result.includes("Push") ? "rgba(255,193,7,0.3)" : "rgba(255,107,107,0.3)", padding: "20px", borderRadius: "5px", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>{result}</h3>
              </div>
            )}

            {/* Action buttons */}
            {gameStatus === "playing" && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={hit} disabled={isLoading} style={{ padding: "12px 30px", fontSize: "16px", background: "#4dabf7", border: "none", color: "white", cursor: "pointer", borderRadius: "5px", opacity: isLoading ? 0.5 : 1 }}>Hit</button>
                <button onClick={stand} disabled={isLoading} style={{ padding: "12px 30px", fontSize: "16px", background: "#ffa94d", border: "none", color: "white", cursor: "pointer", borderRadius: "5px", opacity: isLoading ? 0.5 : 1 }}>Stand</button>
              </div>
            )}

            {/* Play Again */}
            {gameStatus === "game-over" && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => { setGameStatus("betting"); setPlayerHand([]); setDealerHand([]); setResult(""); setMessage("") }}
                  disabled={playerChips <= 0}
                  style={{ padding: "12px 30px", fontSize: "16px", background: "#51cf66", border: "none", color: "white", cursor: "pointer", borderRadius: "5px" }}
                >
                  {playerChips <= 0 ? "Out of chips!" : "Play Again"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
