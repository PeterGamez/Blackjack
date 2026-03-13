"use client"

import styles from "../test.module.css"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import UserService from "../../../lib/UserService"

export default function StorePage() {
  const router = useRouter()
  const [username, setUsername] = useState<string>("")
  const [coins, setCoins] = useState<number>(0)
  const [tokens, setTokens] = useState<number>(0)
  const [selected, setSelected] = useState("card")
  const [hovered, setHovered] = useState<string | null>(null)
  const active = hovered || selected
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
      const data = await UserService.getUser()
      if (!data) return
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

  useEffect(() => {
    const cachedUsername = sessionStorage.getItem("cached_username")
    const cachedCoins = sessionStorage.getItem("cached_coins")
    const cachedTokens = sessionStorage.getItem("cached_tokens")

    if (cachedUsername) setUsername(cachedUsername)
    if (cachedCoins) setCoins(Number(cachedCoins))
    if (cachedTokens) setTokens(Number(cachedTokens))

    loadProfile()
  }, [])

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
        <div className={styles.Title}>
          <h2>Shop</h2>
        </div>

      {/* ===== MAIN AREA ===== */}
      <div className={styles.main}>
        
        {/* SIDEBAR */}
        <div className={styles.sidebar}>
  <button
    className={active === "recommend" ? styles.active : ""}
    onMouseEnter={() => setHovered("recommend")}
    onMouseLeave={() => setHovered(null)}
    onClick={() => {
      setSelected("recommend")
      router.push("/shop")
    }}
  >
    Recommend
  </button>

  <button
    className={active === "theme" ? styles.active : ""}
    onMouseEnter={() => setHovered("theme")}
    onMouseLeave={() => setHovered(null)}
    onClick={() => {
      setSelected("theme")
      router.push("/shop/theme")
    }}
  >
    Theme
  </button>

  <button
    className={active === "card" ? styles.active : ""}
    onMouseEnter={() => setHovered("card")}
    onMouseLeave={() => setHovered(null)}
    onClick={() => {
      setSelected("card")
      router.push("/shop/card")
    }}
  >
    Card
  </button>

  <button
    className={active === "chips" ? styles.active : ""}
    onMouseEnter={() => setHovered("chips")}
    onMouseLeave={() => setHovered(null)}
    onClick={() => {
      setSelected("chips")
      router.push("/shop/chips")
    }}
  >
    Chips
  </button>
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
