"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import config from "./config"

export default function Home() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [coins, setCoins] = useState<number>(0)
  const [cash, setCash] = useState<number>(0)

  // load profile from backend
  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) return
      const res = await fetch(`${config.apiUrl}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) return
      const data = await res.json()
      setUsername(data.username || "")
      if (typeof data.coins === "number") {
        setCoins(data.coins)
      }
      if (typeof data.cash === "number") {
        setCash(data.cash)
      }
    } catch (err) {
      console.error("failed to load profile", err)
    }
  }

  // load cache from localStorage on mount
  useEffect(() => {
    const cachedUsername = localStorage.getItem("cached_username")
    const cachedCoins = localStorage.getItem("cached_coins")
    const cachedCash = localStorage.getItem("cached_cash")

    if (cachedUsername) setUsername(cachedUsername)
    if (cachedCoins) setCoins(Number(cachedCoins))
    if (cachedCash) setCash(Number(cachedCash))

    loadProfile()
  }, [])

  // save to cache whenever username, coins, or cash change
  useEffect(() => {
    if (username) localStorage.setItem("cached_username", username)
    if (coins > 0) localStorage.setItem("cached_coins", coins.toString())
    if (cash > 0) localStorage.setItem("cached_cash", cash.toString())
  }, [username, coins, cash])

  const buttonStyle = (name: string) => ({
    width: "350px",
    padding: "15px 120px",
    fontSize: "20px",
    fontWeight: "bold",
    background: "#4da6ff",
    color: "black",
    border: "3px solid #2b7cd3",
    transform: "skewX(-45deg)",
    cursor: "pointer",
    transition: "0.2s",
    whiteSpace: "nowrap",
    boxShadow:
      hovered === name
        ? "0 0 25px #4da6ff, 0 0 50px #4da6ff"
        : "0 0 10px #4da6ff",
    scale: hovered === name ? "1.05" : "1",
    marginLeft: "-5px"
  })

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#d9d3c7"
      }}
    >

      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "20px 40px"
        }}
      >
        <div
          style={{
            border: "2px solid #3b82f6",
            padding: "10px 20px",
            cursor: "pointer"
          }}
          onClick={() => router.push(username ? "/profile" : "/auth")}
        >
          {username || "Login"}
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ border: "2px solid orange", padding: "10px 20px" }}>
            🪙 {coins}
          </div>
          <div style={{ border: "2px solid #3b82f6", padding: "10px 20px" }}>
            {cash} $ +
          </div>
        </div>
      </div>

      {/* LEFT BOARD */}
      <div style={{ paddingLeft: "40px" }}>
        <div style={{
          width: "250px",
          height: "300px",
          border: "2px solid #3b82f6",
          padding: "20px"
        }}>
          บอร์ดกิจกรรม
        </div>
      </div>

      {/* BOTTOM MENU */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end", // ดันไปขวา
          paddingRight: "5%",        // เว้นขอบขวา
          paddingBottom: "30px"
        }}
      >
        <button
          onClick={() => router.push("/Skin")}
          onMouseEnter={() => setHovered("skin")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("skin")}
        >
          <span style={{ display: "inline-block", transform: "skewX(45deg)" }}>
            Skin
          </span>
        </button>

        <button
          onClick={() => router.push("/Gambling")}
          onMouseEnter={() => setHovered("gambling")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("gambling")}
        >
          <span style={{ display: "inline-block", transform: "skewX(45deg)" }}>
            Gambling
          </span>
        </button>

        <button
          onClick={() => router.push("/CreateTable")}
          onMouseEnter={() => setHovered("create")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("create")}
        >
          <span style={{ display: "inline-block", transform: "skewX(45deg)" }}>
            Create Table
          </span>
        </button>

        <button
          onClick={() => router.push("/ModeSelecter")}
          onMouseEnter={() => setHovered("play")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("play")}
        >
          <span style={{ display: "inline-block", transform: "skewX(45deg)" }}>
            Play
          </span>
        </button>
      </div>

    </div>
  )
}