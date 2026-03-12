"use client"

import styles from "../test.module.css"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import config from "../../config"

export default function StorePage() {
  const router = useRouter()
  const [username, setUsername] = useState<string>("")
  const [coins, setCoins] = useState<number>(0)
  const [tokens, setTokens] = useState<number>(0)
  const products = [
  { name: 'Name', price: 'price' },
  { name: 'Name', price: 'price' },
  { name: 'Name', price: 'price' },
  { name: 'Name', price: 'price' },
  { name: 'Name', price: 'price' },
  { name: 'Name', price: 'price' },
  { name: 'Name', price: 'price' },
  { name: 'Name', price: 'price' },
];

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
        {/* Mode Title */}
        <div className={styles.Title}>
          <h2>Shop</h2>
        </div>

      {/* ===== MAIN AREA ===== */}
      <div className={styles.main}>
        
        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          <button onClick={() => router.push("/shop")}>Recommend</button>
          <button onClick={() => router.push("/shop/theme")}>Theme</button>
          <button onClick={() => router.push("/shop/card")}>Card</button>
          <button className={styles.active} onClick={() => router.push("/shop/chips")}>Chips</button>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          {products.map((p, index) => (
          <div key={index} className={styles.product}>
            <div className={styles.productPreview}></div>
            <div className={styles.productInfo}>
              <strong>{p.name}</strong>
              <span>{p.price}</span>
            </div>
          </div>
          ))}
        </div>
      </div>
    </div>
  )
}
