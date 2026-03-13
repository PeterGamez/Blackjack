"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import config from "./config"

export default function Home() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [coins, setCoins] = useState<number>(0)
  const [tokens, setTokens] = useState<number>(0)

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
      if (typeof data.tokens === "number") {
        setTokens(data.tokens)
      }
    } catch (err) {
      console.error("failed to load profile", err)
    }
  }

  // load cache from localStorage on mount
  useEffect(() => {
    const cachedUsername = localStorage.getItem("cached_username")
    const cachedCoins = localStorage.getItem("cached_coins")
    const cachedTokens = localStorage.getItem("cached_tokens")
    const storedUser = localStorage.getItem("user")

    if (cachedUsername) setUsername(cachedUsername)
    if (cachedCoins) setCoins(Number(cachedCoins))
    if (cachedTokens) setTokens(Number(cachedTokens))

    loadProfile()
  }, [])

  // save to cache whenever username, coins, or tokens change
  useEffect(() => {
    if (username) localStorage.setItem("cached_username", username)
    if (coins > 0) localStorage.setItem("cached_coins", coins.toString())
    if (tokens > 0) localStorage.setItem("cached_tokens", tokens.toString())
  }, [username, coins, tokens])

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

 const buttonStyle = (name: string) => {
  let background = ""

  switch (name) {

    // 1️⃣ Shop
    case "shop":
      background =
        "linear-gradient(90deg, #C99A3F 0%, #E6B85C 50%, #F2C879 100%)"
      break

    // 2️⃣ Inventory
    case "inventory":
      background = "#F2C879"
      break

    // 3️⃣ Gambling
    case "gambling":
      background =
        "linear-gradient(90deg, #F2C879 0%, #E6B85C 50%, #C99A3F 100%)"
      break

    // 4️⃣ Create Table
    case "create":
      background = "#C99A3F"
      break

    // 5️⃣ Play
    case "play":
      background =
        "linear-gradient(90deg,  #C99A3F 0%, #E6B85C 50%, #F2C879 100%)"
      break

    default:
      background = "#E6B85C"
  }

  return {
    width: "17%",
    height: "64px",
    fontSize: "24px",
    fontWeight: "bold",
    background,
    color: "#1a1a1a",
    border: "2px solid rgba(0,0,0,0.25)",
    transform:
      hovered === name
        ? "skewX(-45deg) scale(1.05)"
        : "skewX(-45deg)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    marginLeft: "-6px",
    boxShadow: hovered === name
      ? "0 8px 20px rgba(0,0,0,0.25)"
      : "0 2px 6px rgba(0,0,0,0.15)"
  }
}

  const menuItems = [
    { key: "shop", label: "Shop", path: "/shop" },
    { key: "inventory", label: "Inventory", path: "/profile" },
    { key: "gambling", label: "Gambling", path: "/gambling" },
    { key: "create", label: "Create Table", path: "/createtable" },
    { key: "play", label: "Play", path: "/play" }
  ]

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#1E2430",
        padding: "28px 60px 56px"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          gap: "32px"
        }}
      >
        <div
          onClick={() => router.push(username ? "/profile" : "/auth")}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            gap: 0,
            background: "rgba(92, 107, 138, 0.6)",
            border: "1px solid rgba(92, 107, 138, 0.8)",
            borderRadius: "20px",
            padding: "8px 24px 8px 0",
            height: "64px",
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: username ? getAvatarColor(username) : "#5c6b8a",
              border: "3px solid #5c6b8a",
              zIndex: 2,
              marginLeft: "-20px",
              marginRight: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
              color: "#ffffff",
              userSelect: "none",
              flexShrink: 0
            }}
          >
            {username ? username[0].toUpperCase() : "?"}
          </div>
          <div
            style={{
              color: "#e6eaf2",
              display: "flex",
              alignItems: "center",
              fontSize: "18px",
              fontWeight: 400
            }}
          >
            {username || "username"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginRight: "0" }}>
          <div
            style={{
              height: "64px",
              minWidth: "220px",
              borderRadius: "20px",
              background: "rgba(92, 107, 138, 0.6)",
              border: "1px solid rgba(92, 107, 138, 0.8)",
              color: "#e6eaf2",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "16px",
              fontSize: "18px",
              padding: "0 24px",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(92, 107, 138, 0.8)"
              e.currentTarget.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(92, 107, 138, 0.6)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <span style={{ fontSize: "20px" }}>🪙</span>
            {coins.toLocaleString()}
          </div>

          <div
            style={{
              height: "64px",
              minWidth: "220px",
              borderRadius: "20px",
              background: "rgba(92, 107, 138, 0.6)",
              border: "1px solid rgba(92, 107, 138, 0.8)",
              color: "#e6eaf2",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "16px",
              fontSize: "18px",
              padding: "0 24px",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={() => router.push("/topup")}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(92, 107, 138, 0.8)"
              e.currentTarget.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(92, 107, 138, 0.6)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "#b28bff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 700,
                color: "#1a1a1a"
              }}
            >
              T
            </div>
            {tokens.toLocaleString()}
            <span style={{ fontSize: "28px", lineHeight: 1, marginLeft: "auto", fontWeight: 700 }}>+</span>
          </div>
        </div>
      </div>

      <div style={{ paddingLeft: "6px" }}>
        <div
          style={{
            width: "270px",
            height: "420px",
            borderRadius: "14px",
            background: "#d9d9d9"
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "2px"
        }}
      >
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => router.push(item.path)}
            onMouseEnter={() => setHovered(item.key)}
            onMouseLeave={() => setHovered(null)}
            style={buttonStyle(item.key)}
          >
            <span style={{ display: "inline-block", transform: "skewX(45deg)" }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}