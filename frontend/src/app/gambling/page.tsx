"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import SessionCache from "../../lib/SessionCache";
import UserService from "../../lib/UserService";
import ProfileAvatar from "../components/ProfileAvatar";
import styles from "./gambling.module.css";

export default function Home() {
  const router = useRouter();
  const cachedProfile = SessionCache.getCachedProfileSnapshot();
  const [hovered, setHovered] = useState<string | null>(null);
  const [username, setUsername] = useState<string>(cachedProfile.username);
  const [coins, setCoins] = useState<number>(cachedProfile.coins);
  const [tokens, setTokens] = useState<number>(cachedProfile.tokens);
  const stageRef = useRef<HTMLDivElement | null>(null);

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

  // save to cache whenever username, coins, or tokens change
  useEffect(() => {
    SessionCache.persistCachedProfile({ username, coins, tokens });
  }, [username, coins, tokens]);

  useEffect(() => {
    const updateStageScale = () => {
      const widthScale = window.innerWidth / 1920;
      const heightScale = window.innerHeight / 1080;
      const nextScale = Math.min(widthScale, heightScale);
      const scaledWidth = 1920 * nextScale;
      const scaledHeight = 1080 * nextScale;
      const nextLeft = Math.max((window.innerWidth - scaledWidth) / 2, 0);
      const nextTop = Math.max((window.innerHeight - scaledHeight) / 2, 12);

      if (stageRef.current) {
        stageRef.current.style.left = `${nextLeft}px`;
        stageRef.current.style.top = `${nextTop}px`;
        stageRef.current.style.transform = `scale(${nextScale})`;
      }
    };

    updateStageScale();
    window.addEventListener("resize", updateStageScale);
    return () => window.removeEventListener("resize", updateStageScale);
  }, []);

  const getButtonClass = (name: string): string => {
    return `${styles.gameButton} ${hovered === name ? styles.hovered : ""}`;
  };

  return (
    <div className={styles.container}>
      <div ref={stageRef} className={styles.stage}>
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
        <div className={styles.modeTitle}>
          <h2>Gambling</h2>
        </div>

        {/* Mode Selector Row */}
        <div className={styles.modeSelector}>
          {/* Bet on - Player VS Dealer */}
          <button onClick={() => router.push("/comingsoon")} onMouseEnter={() => setHovered("quickDealer")} onMouseLeave={() => setHovered(null)} className={getButtonClass("quickDealer")}>
            <div className={styles.buttonTitle}>Bet on </div>
            <div className={styles.buttonSubtitle}>Player</div>
            <div className={styles.buttonSubtitle}>VS</div>
            <div className={styles.buttonSubtitle}>Dealer</div>
          </button>

          {/* Quick Play - Player VS Player */}
          <button onClick={() => router.push("/comingsoon")} onMouseEnter={() => setHovered("quickPlayer")} onMouseLeave={() => setHovered(null)} className={getButtonClass("quickPlayer")}>
            <div className={styles.buttonTitle}>Bet on</div>
            <div className={styles.buttonSubtitle}>Player</div>
            <div className={styles.buttonSubtitle}>VS</div>
            <div className={styles.buttonSubtitle}>Player</div>
          </button>
        </div>
      </div>
    </div>
  );
}
