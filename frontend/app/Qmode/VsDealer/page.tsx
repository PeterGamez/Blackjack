"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import config from "../../config"
import { io, Socket } from "socket.io-client"

interface Card {
  suit: string
  rank: string
  value: number
}

type GameStatus = "betting" | "playing" | "dealer-turn" | "game-over"

export default function VsDealer() {
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const [gameStatus, setGameStatus] = useState<GameStatus>("betting")
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [dealerVisibleHand, setDealerVisibleHand] = useState<Card[]>([])
  const [bet, setBet] = useState<number>(0)
  const [playerChips, setPlayerChips] = useState<number>(0)
  const [message, setMessage] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const [tempBet, setTempBet] = useState<string>("10")
  const [gameId, setGameId] = useState<number>(0)
  const [deck, setDeck] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<number>(0)

  // Initialize Socket.IO connection and ensure user is logged in
  useEffect(() => {
    const cachedCoins = localStorage.getItem("cached_coins")
    const token = localStorage.getItem("accessToken")

    if (!token) {
      router.push("/login")
      return
    }

    if (cachedCoins) {
      setPlayerChips(Number(cachedCoins))
    }

    // fetch profile to get user id if not already stored
    (async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUserId(data.id)
          localStorage.setItem("userId", data.id.toString())
        }
      } catch {
        // ignore
      }
    })()

    const socket = io(config.socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: { token } // if backend uses it
    })

    socket.on("connect", () => {
      console.log("Connected to Socket.IO")
    })

    socket.on("game:started", (gameState: any) => {
      setPlayerHand(JSON.parse(gameState.playerHand || "[]"))
      setDealerHand(JSON.parse(gameState.dealerHand || "[]"))
      setDealerVisibleHand([JSON.parse(gameState.dealerHand || "[]")[0]].filter(c => c))
      setGameId(gameState.gameId)
    })

    socket.on("game:player-hit", (data: any) => {
      setPlayerHand(JSON.parse(data.playerHand || "[]"))
    })

    socket.on("game:bust", (data: any) => {
      setResult("BUST! Dealer wins")
      setGameStatus("game-over")
    })

    socket.on("game:finished", (gameState: any) => {
      setPlayerHand(JSON.parse(gameState.playerHand || "[]"))
      setDealerHand(JSON.parse(gameState.dealerHand || "[]"))
      setDealerVisibleHand(JSON.parse(gameState.dealerHand || "[]"))
      
      const resultMsg = gameState.result === "win" ? "You win!" : gameState.result === "push" ? "Push!" : "Dealer wins"
      setResult(resultMsg)
      
      const newCoins = playerChips + (gameState.reward - bet)
      setPlayerChips(newCoins)
      localStorage.setItem("cached_coins", newCoins.toString())
      
      setGameStatus("game-over")
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO")
    })

    socketRef.current = socket

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const calculateHandValue = (hand: Card[]) => {
    let value = 0
    let aces = 0
    for (const card of hand) {
      value += card.value
      if (card.rank === "A") aces++
    }
    while (value > 21 && aces > 0) {
      value -= 10
      aces--
    }
    return value
  }

  const startGame = async (betAmount: number) => {
    if (betAmount <= 0 || betAmount > playerChips) {
      setMessage("Invalid bet amount")
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        setMessage("Unauthorized")
        return
      }

      // Get user ID from JWT or previous storage
      let uid = userId
      if (!uid) {
        // You might need to decode JWT or store userId somewhere
        uid = parseInt(localStorage.getItem("userId") || "0")
        setUserId(uid)
      }

      const res = await fetch(`${config.apiUrl}/api/game/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameType: "vsDealer",
          bet: betAmount,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        setMessage(error.error || "Failed to start game")
        setIsLoading(false)
        return
      }

      const data = await res.json()
      const newGameId = data.gameId

      // Emit game:start to Socket.IO
      socketRef.current?.emit(
        "game:start",
        {
          gameId: newGameId,
          userId: uid,
          gameType: "vsDealer",
          bet: betAmount,
        },
        (ack: any) => {
          if (ack?.ok) {
            setGameId(newGameId)
            setPlayerHand(data.playerHand)
            setDealerHand(data.dealerHand)
            setDealerVisibleHand(data.dealerHand)
            setBet(betAmount)
            setPlayerChips(playerChips - betAmount)
            setDeck(data.deck)
            setGameStatus("playing")
            setMessage("")
            setResult("")
            setTempBet("")
          }
        }
      )
    } catch (err) {
      setMessage("Error starting game")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const hit = async () => {
    if (isLoading || !socketRef.current) return

    setIsLoading(true)
    try {
      socketRef.current.emit(
        "game:hit",
        {
          gameId,
          userId,
          playerHand: JSON.stringify(playerHand),
          deck: JSON.stringify(deck),
          playerValue: calculateHandValue(playerHand),
        },
        (ack: any) => {
          setIsLoading(false)
          if (!ack?.ok) {
            setMessage("Failed to hit")
          }
        }
      )
    } catch (err) {
      setMessage("Error hitting")
      console.error(err)
      setIsLoading(false)
    }
  }

  const stand = async () => {
    if (isLoading || !socketRef.current) return

    setIsLoading(true)
    try {
      const playerValue = calculateHandValue(playerHand)
      const dealerValue = calculateHandValue(dealerHand)

      // Simulate dealer play
      let newDealerHand = [...dealerHand]
      let deckIndex = 0
      const parsedDeck = deck

      while (calculateHandValue(newDealerHand) < 17 && deckIndex < parsedDeck.length) {
        newDealerHand.push(parsedDeck[deckIndex])
        deckIndex++
      }

      const newDealerValue = calculateHandValue(newDealerHand)

      let result: "win" | "lose" | "push"
      let reward = 0

      if (newDealerValue > 21) {
        result = "win"
        reward = bet * 2
      } else if (playerValue > newDealerValue) {
        result = "win"
        reward = bet * 2
      } else if (newDealerValue > playerValue) {
        result = "lose"
        reward = 0
      } else {
        result = "push"
        reward = bet
      }

      socketRef.current.emit(
        "game:stand",
        {
          gameId,
          userId,
          deck: JSON.stringify(parsedDeck.slice(deckIndex)),
          playerHand: JSON.stringify(playerHand),
          dealerHand: JSON.stringify(newDealerHand),
          playerValue,
          dealerValue: newDealerValue,
          result,
          reward,
        },
        (ack: any) => {
          setIsLoading(false)
          if (!ack?.ok) {
            setMessage("Failed to stand")
          }
        }
      )
    } catch (err) {
      setMessage("Error standing")
      console.error(err)
      setIsLoading(false)
    }
  }

  const playerValue = calculateHandValue(playerHand)
  const dealerValue = calculateHandValue(dealerVisibleHand)

  return (
    <div style={{ background: "#2d5016", minHeight: "100vh", color: "white", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <button
          onClick={() => {
            if (socketRef.current) {
              socketRef.current.emit("game:leave", { gameId, userId })
            }
            router.push("/Qmode")
          }}
          style={{
            padding: "10px 20px",
            background: "#ff6b6b",
            border: "none",
            color: "white",
            cursor: "pointer",
            borderRadius: "5px"
          }}
          disabled={isLoading}
        >
          Back
        </button>
        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
          Chips: {playerChips}
        </div>
      </div>

      {/* Game Area */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {gameStatus === "betting" && (
          <div
            style={{
              textAlign: "center",
              background: "rgba(0,0,0,0.3)",
              padding: "40px",
              borderRadius: "10px",
              marginTop: "100px"
            }}
          >
            <h2>Place Your Bet</h2>
            <input
              type="number"
              value={tempBet}
              onChange={(e) => setTempBet(e.target.value)}
              style={{
                padding: "10px",
                fontSize: "16px",
                width: "100px",
                marginRight: "10px",
                borderRadius: "5px",
                border: "none"
              }}
              disabled={isLoading}
            />
            <button
              onClick={() => startGame(parseInt(tempBet))}
              style={{
                padding: "10px 30px",
                fontSize: "16px",
                background: "#51cf66",
                border: "none",
                color: "white",
                cursor: "pointer",
                borderRadius: "5px",
                opacity: isLoading ? 0.5 : 1
              }}
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
            <div style={{ marginBottom: "40px" }}>
              <h3>Dealer - Value: {dealerValue}</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {dealerVisibleHand.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      width: "80px",
                      height: "120px",
                      background: "white",
                      color: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "bold",
                      borderRadius: "5px",
                      border: "2px solid gold"
                    }}
                  >
                    {card.rank}{card.suit}
                  </div>
                ))}
              </div>
            </div>

            {/* Player Hand */}
            <div style={{ marginBottom: "40px" }}>
              <h3>Your Hand - Value: {playerValue}</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {playerHand.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      width: "80px",
                      height: "120px",
                      background: "white",
                      color: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "bold",
                      borderRadius: "5px",
                      border: "2px solid gold"
                    }}
                  >
                    {card.rank}{card.suit}
                  </div>
                ))}
              </div>
            </div>

            {/* Result */}
            {result && (
              <div
                style={{
                  textAlign: "center",
                  background: result.includes("win")
                    ? "rgba(81, 207, 102, 0.3)"
                    : result.includes("push")
                      ? "rgba(255, 193, 7, 0.3)"
                      : "rgba(255, 107, 107, 0.3)",
                  padding: "20px",
                  borderRadius: "5px",
                  marginBottom: "20px"
                }}
              >
                <h3 style={{ margin: 0 }}>{result}</h3>
              </div>
            )}

            {/* Buttons */}
            {gameStatus === "playing" && playerValue <= 21 && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  onClick={hit}
                  style={{
                    padding: "12px 30px",
                    fontSize: "16px",
                    background: "#4dabf7",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "5px",
                    opacity: isLoading ? 0.5 : 1
                  }}
                  disabled={isLoading}
                >
                  Hit
                </button>
                <button
                  onClick={stand}
                  style={{
                    padding: "12px 30px",
                    fontSize: "16px",
                    background: "#ffa94d",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "5px",
                    opacity: isLoading ? 0.5 : 1
                  }}
                  disabled={isLoading}
                >
                  Stand
                </button>
              </div>
            )}

            {/* Play Again */}
            {gameStatus === "game-over" && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setGameStatus("betting")}
                  style={{
                    padding: "12px 30px",
                    fontSize: "16px",
                    background: "#51cf66",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "5px"
                  }}
                  disabled={playerChips <= 0}
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
