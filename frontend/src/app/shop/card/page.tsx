"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import SessionCache from "../../../lib/SessionCache";
import UserService from "../../../lib/UserService";
import ProfileAvatar from "../../components/ProfileAvatar";
import styles from "../test.module.css";

export default function StorePage() {
  const router = useRouter();
  const cachedProfile = SessionCache.getCachedProfileSnapshot();
  const [username, setUsername] = useState<string>(cachedProfile.username);
  const [coins, setCoins] = useState<number>(cachedProfile.coins);
  const [tokens, setTokens] = useState<number>(cachedProfile.tokens);
  const [selected, setSelected] = useState("card");
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered || selected;
  const products = [
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
    { name: "Name", price: "price" },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await UserService.getUser();
        if (!data) return;
        setUsername(data.username || "");
        if (typeof data.coins === "number") {
          setCoins(data.coins);
        }
        if (typeof data.tokens === "number") {
          setTokens(data.tokens);
        }
      } catch (err) {
        console.error("failed to load profile", err);
      }
    };

    void loadProfile();
  }, []);

  return (
    <div className={styles.container}>
      {/* Top Bar with User Info */}
      <div className={styles.topBar}>
        {/* Profile Section */}
        <div className={styles.profileSection}>
          <ProfileAvatar username={username} className={styles.profileAvatar} />
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
      <button onClick={() => router.push("/")} className={styles.backButton}>
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
              setSelected("recommend");
              router.push("/shop");
            }}>
            Recommend
          </button>

          <button
            className={active === "theme" ? styles.active : ""}
            onMouseEnter={() => setHovered("theme")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected("theme");
              router.push("/shop/theme");
            }}>
            Theme
          </button>

          <button
            className={active === "card" ? styles.active : ""}
            onMouseEnter={() => setHovered("card")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected("card");
              router.push("/shop/card");
            }}>
            Card
          </button>

          <button
            className={active === "chips" ? styles.active : ""}
            onMouseEnter={() => setHovered("chips")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected("chips");
              router.push("/shop/chips");
            }}>
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
  );
}
