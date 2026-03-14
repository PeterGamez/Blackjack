"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import SessionCache from "../../lib/SessionCache";
import UserService from "../../lib/UserService";
import styles from "./page.module.css";

interface Package {
  tokens: number;
  price: number;
}

const PACKAGES: Package[] = [
  { tokens: 350, price: 35 },
  { tokens: 1100, price: 99 },
  { tokens: 2100, price: 179 },
  { tokens: 4500, price: 349 },
  { tokens: 10000, price: 729 },
  { tokens: 28000, price: 1800 },
];

export default function TopupPage() {
  const router = useRouter();
  const cachedProfile = SessionCache.getCachedProfileSnapshot();
  const [tokens, setTokens] = useState<number>(cachedProfile.tokens);
  const [coins, setCoins] = useState<number>(cachedProfile.coins);
  const [username, setUsername] = useState<string>(cachedProfile.username);
  // tabs removed, always show packages

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await UserService.getUser();
        if (!data) {
          router.replace("/auth");
          return;
        }
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
  }, [router]);

  useEffect(() => {
    SessionCache.persistCachedProfile({ username, coins, tokens });
  }, [username, coins, tokens]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div onClick={() => router.push(username ? "/profile" : "/auth")} className={styles.userCard}>
          <div className={styles.userAvatar} />
          <div className={styles.userName}>{username || "username"}</div>
        </div>

        <div className={styles.balanceRow}>
          <div className={styles.balanceCard} onClick={() => router.push("/topup")}>
            <span className={styles.coinBadge}>🪙</span>
            {coins.toLocaleString()}
          </div>

          <div className={styles.balanceCard} onClick={() => router.push("/topup")}>
            <div className={styles.tokenIcon}>T</div>
            {tokens.toLocaleString()}
            <span className={styles.plus}>+</span>
          </div>
        </div>
      </div>

      <button onClick={() => router.push("/")} className={styles.backButton}>
        ← Lobby
      </button>

      <h1 className={styles.title}>Top Up</h1>

      <div className={styles.gridShell}>
        <div className={styles.grid}>
          {PACKAGES.map((pkg) => (
            <div key={pkg.tokens} className={styles.packageCard} onClick={() => router.push(`/payment?tokens=${pkg.tokens}&price=${pkg.price}`)}>
              <div className={styles.packageInfo}>
                {pkg.tokens.toLocaleString()} Token
                <br />
                {pkg.price} Bath
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
