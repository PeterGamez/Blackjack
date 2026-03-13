"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import config from "../../config"
import styles from "./play.module.css"

export default function Home() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [coins, setCoins] = useState<number>(0)
  const [tokens, setTokens] = useState<number>(0)
  const [stageScale, setStageScale] = useState<number>(1)
  const [stageTop, setStageTop] = useState<number>(0)
  const [stageLeft, setStageLeft] = useState<number>(0)

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
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.replace("/auth")
      return
    }

    const cachedUsername = localStorage.getItem("cached_username")
    const cachedCoins = localStorage.getItem("cached_coins")
    const cachedTokens = localStorage.getItem("cached_tokens")

    if (cachedUsername) setUsername(cachedUsername)
    if (cachedCoins) setCoins(Number(cachedCoins))
    if (cachedTokens) setTokens(Number(cachedTokens))

    loadProfile()
  }, [router])

  // save to cache whenever username, coins, or tokens change
  useEffect(() => {
    if (username) localStorage.setItem("cached_username", username)
    if (coins > 0) localStorage.setItem("cached_coins", coins.toString())
    if (tokens > 0) localStorage.setItem("cached_tokens", tokens.toString())
  }, [username, coins, tokens])

  useEffect(() => {
    const updateStageScale = () => {
      const widthScale = window.innerWidth / 1920
      const heightScale = window.innerHeight / 1080
      const nextScale = Math.min(widthScale, heightScale)
      const scaledWidth = 1920 * nextScale
      const scaledHeight = 1080 * nextScale
      const nextLeft = Math.max((window.innerWidth - scaledWidth) / 2, 0)
      const nextTop = Math.max((window.innerHeight - scaledHeight) / 2, 12)

      setStageScale(nextScale)
      setStageLeft(nextLeft)
      setStageTop(nextTop)
    }

    updateStageScale()
    window.addEventListener("resize", updateStageScale)
    return () => window.removeEventListener("resize", updateStageScale)
  }, [])

  const getButtonClass = (name: string): string => {
    return `${styles.gameButton} ${hovered === name ? styles.hovered : ""}`
  }

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

  return (
    <div className={styles.container}>
      <div
        className={styles.stage}
        style={{
          left: `${stageLeft}px`,
          top: `${stageTop}px`,
          transform: `scale(${stageScale})`,
        }}
      >
        {/* Top Bar with User Info */}
        <div className={styles.topBar}>
          {/* Profile Section */}
          <div className={styles.profileSection}>
            <div
              className={styles.profileAvatar}
              style={{ background: username ? getAvatarColor(username) : "#5c6b8a" }}
            >
              {username ? username[0].toUpperCase() : "?"}
            </div>
            <span className={styles.username}>{username}</span>
          </div>

          {/* Right: Coins and Tokens */}
          <div className={styles.resourcesSection}>
            {/* Coins */}
            <div className={styles.resourceBox}>
              <span className={styles.coinIcon}>🪙</span>
              <span className={styles.resourceValue}>{coins.toLocaleString()}</span>
            </div>

            {/* Tokens */}
            <div className={styles.resourceBox}>
              <div className={styles.tokenIcon}>
                <span className={styles.tokenLetter}>T</span>
              </div>
              <span className={styles.resourceValue}>{tokens.toLocaleString()}</span>
              <button className={styles.plusButton}>+</button>
            </div>
          </div>
        </div>
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className={styles.backButton}
        >
          ← Lobby
        </button>

        {/* Mode Title */}
        <div className={styles.modeTitle}>
          <h2>Mode</h2>
        </div>

        {/* Mode Selector Row */}
        <div className={styles.modeSelector}>
          {/* Quick Play - Player VS Dealer */}
          <button
            onClick={() => router.push("/play/quick/dealer")}
            onMouseEnter={() => setHovered("quickDealer")}
            onMouseLeave={() => setHovered(null)}
            className={getButtonClass("quickDealer")}
          >
            <div className={styles.buttonTitle}>Quick Play</div>
            <div className={styles.buttonSubtitle}>Player</div>
            <div className={styles.buttonSubtitle}>VS</div>
            <div className={styles.buttonSubtitle}>Dealer</div>
          </button>

          {/* Quick Play - Player VS Player */}
          <button
            onClick={() => router.push("/play/quick/player")}
            onMouseEnter={() => setHovered("quickPlayer")}
            onMouseLeave={() => setHovered(null)}
            className={getButtonClass("quickPlayer")}
          >
            <div className={styles.buttonTitle}>Quick Play</div>
            <div className={styles.buttonSubtitle}>Player</div>
            <div className={styles.buttonSubtitle}>VS</div>
            <div className={styles.buttonSubtitle}>Player</div>
          </button>

          {/* Rank */}
          <button
            onClick={() => router.push("/play/rank")}
            onMouseEnter={() => setHovered("rank")}
            onMouseLeave={() => setHovered(null)}
            className={getButtonClass("rank")}
          >
            <div className={styles.buttonTitle}>Rank</div>
          </button>
        </div>
      </div>
    </div>
  )
}