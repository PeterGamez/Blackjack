"use client"

import styles from "./shop.module.css"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import config from "../config"

export default function StorePage() {
  const router = useRouter()
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

    if (cachedUsername) setUsername(cachedUsername)
    if (cachedCoins) setCoins(Number(cachedCoins))
    if (cachedTokens) setTokens(Number(cachedTokens))

    loadProfile()
  }, [])

  return (
    <div className={styles.container}>
      
      {/* Top Bar with User Info */}
        <div className={styles.topBar}>
          {/* Profile Section */}
          <div className={styles.profileSection}>
            <div className={styles.profileAvatar}></div>
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

      {/* ===== MAIN AREA ===== */}
      <div className={styles.main}>
        
        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          <button>Recommend</button>
          <button>Theme</button>
          <button>Card</button>
          <button>Chips</button>
        </div>

        {/* CONTENT */}
        <div className={styles.content}></div>

      </div>
    </div>
  )
}