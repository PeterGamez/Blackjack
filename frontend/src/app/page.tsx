"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import SessionCache from "../lib/SessionCache";
import UserService from "../lib/UserService";
import ProfileAvatar from "./components/ProfileAvatar";
import styles from "./page.module.css";

const menuItems = [
  { key: "shop", label: "Shop", path: "/shop", className: styles.menuButtonShop },
  { key: "inventory", label: "Inventory", path: "/profile", className: styles.menuButtonInventory },
  { key: "gambling", label: "Gambling", path: "/gambling", className: styles.menuButtonGambling },
  { key: "create", label: "Create Table", path: "/createtable", className: styles.menuButtonCreate },
  { key: "play", label: "Play", path: "/play", className: styles.menuButtonPlay },
] as const;

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
            <ProfileAvatar username={username} className={styles.avatar} />
            <div className={styles.username}>{username || "username"}</div>
          </div>

          <div className={styles.balanceWrap}>
            <div className={styles.statCard}>
              <span className={styles.coinBadge}>🪙</span>
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
