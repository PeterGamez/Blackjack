"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SessionCache from "../lib/SessionCache";
import UserService from "../lib/UserService";
import styles from "./page.module.css";

const menuItems = [
  { key: "shop", label: "Shop", path: "/shop", className: styles.menuButtonShop },
  { key: "inventory", label: "Inventory", path: "/profile", className: styles.menuButtonInventory },
  { key: "gambling", label: "Gambling", path: "/gambling", className: styles.menuButtonGambling },
  { key: "create", label: "Create Table", path: "/createtable", className: styles.menuButtonCreate },
  { key: "play", label: "Play", path: "/play", className: styles.menuButtonPlay },
] as const;

const getAvatarColor = (name: string) => {
  const colors = ["#e05c5c", "#e0885c", "#d4a632", "#6db86d", "#5cb8b8", "#5c8ae0", "#8e5ce0", "#c05ce0", "#e05c9a", "#4ca8c8"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Home() {
  const router = useRouter();
  const cachedProfile = SessionCache.getCachedProfileSnapshot();
  const [username, setUsername] = useState<string>(cachedProfile.username);
  const [coins, setCoins] = useState<number>(cachedProfile.coins);
  const [tokens, setTokens] = useState<number>(cachedProfile.tokens);

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

  // save to cache whenever username, coins, or tokens change
  useEffect(() => {
    SessionCache.persistCachedProfile({ username, coins, tokens });
  }, [username, coins, tokens]);

  const avatarColor = useMemo(() => (username ? getAvatarColor(username) : "#5c6b8a"), [username]);
  const coinsLabel = useMemo(() => coins.toLocaleString(), [coins]);
  const tokensLabel = useMemo(() => tokens.toLocaleString(), [tokens]);

  return (
    <div className={styles.page}>
      <video autoPlay loop muted playsInline className={styles.bgVideo}>
        <source src="/videos/home-bg.mp4" type="video/mp4" />
      </video>

      <div className={styles.bgOverlay} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <div onClick={() => router.push(username ? "/profile" : "/auth")} className={styles.profileCard}>
            <div className={styles.avatar} style={{ background: avatarColor }}>
              {username ? username[0].toUpperCase() : "?"}
            </div>
            <div className={styles.username}>{username || "username"}</div>
          </div>

          <div className={styles.balanceWrap}>
            <div className={styles.statCard}>
              <span style={{ fontSize: "20px" }}>🪙</span>
              {coinsLabel}
            </div>

            <div className={styles.statCard} onClick={() => router.push("/topup")}>
              <div className={styles.tokenIcon}>T</div>
              {tokensLabel}
              <span className={styles.plus}>+</span>
            </div>
          </div>
        </div>

        <div className={styles.placeholderWrap}>
          <div className={styles.placeholder} />
        </div>

        <div className={styles.menuRow}>
          {menuItems.map((item) => (
            <button key={item.key} onClick={() => router.push(item.path)} className={`${styles.menuButton} ${item.className}`}>
              <span className={styles.menuLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
