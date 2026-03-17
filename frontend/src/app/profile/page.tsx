"use client";

import ProfileAvatar from "@components/ProfileAvatar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";

import styles from "./page.module.css";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  coins: number;
  tokens: number;
  inventory: { productId: number; type: string }[];
};

type GameHistoryEntry = {
  result: "win" | "lose" | "draw" | "blackjack";
};

type RoleTheme = {
  avatarFrameClassName: string;
  badgeClassName: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(null);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const [userData, historyData] = await Promise.all([UserService.getUser(), UserService.getGameHistory()]);

      if (cancelled) {
        return;
      }

      if (!userData) {
        setIsLoading(false);
        return;
      }

      setUser(userData);
      setHistory(historyData);
      LocalStorage.setItem("coins", userData.coins.toString());
      LocalStorage.setItem("tokens", userData.tokens.toString());
      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    UserService.logout();
    router.push("/auth");
  };

  if (isLoading) {
    return <div className={styles.page} />;
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <p>No profile data. Please login first.</p>
          <button type="button" onClick={() => router.push("/auth")} className={styles.primaryButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const wins = history.filter((game) => game.result === "win" || game.result === "blackjack").length;
  const losses = history.filter((game) => game.result === "lose").length;
  const draws = history.filter((game) => game.result === "draw").length;
  const gamesPlayed = history.length;
  const decidedGames = wins + losses;
  const winRate = decidedGames > 0 ? (wins / decidedGames) * 100 : 0;

  const ownedSkins = user.inventory.reduce(
    (counts, item) => {
      if (item.type === "card" || item.type === "chip" || item.type === "table") {
        counts[item.type] += 1;
      }

      return counts;
    },
    { card: 0, chip: 0, table: 0 }
  );

  const primaryRole = user.role.toUpperCase();
  const roleKey = user.role.toLowerCase();

  const roleTheme: RoleTheme =
    roleKey === "admin"
      ? { avatarFrameClassName: styles.adminAvatarFrame, badgeClassName: styles.adminBadge }
      : roleKey === "vip"
        ? { avatarFrameClassName: styles.vipAvatarFrame, badgeClassName: styles.vipBadge }
        : { avatarFrameClassName: styles.defaultAvatarFrame, badgeClassName: styles.defaultBadge };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <button type="button" onClick={() => router.push("/")} className={styles.backButton}>
            ← Lobby
          </button>
          <h1 className={styles.pageTitle}>Profile</h1>
          <div className={styles.headerSpacer} aria-hidden="true" />
        </div>

        <div className={styles.card}>
          <div className={styles.sideActions}>
            <button type="button" onClick={() => router.push("/profile/history")} className={`${styles.sideButton} ${styles.historyButton}`}>
              History
            </button>
            {user.role === "admin" && (
              <button type="button" onClick={() => router.push("/admin")} className={`${styles.sideButton} ${styles.adminButton}`}>
                Admin Panel
              </button>
            )}
          </div>

          <div className={styles.profileTop}>
            <div className={`${styles.avatarFrame} ${roleTheme.avatarFrameClassName}`.trim()}>
              <ProfileAvatar username={user.username} className={styles.avatar} />
            </div>
            <h1 className={styles.username}>{user.username}</h1>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${roleTheme.badgeClassName}`.trim()}>{primaryRole}</span>
            </div>
            <p className={styles.email}>{user.email}</p>
          </div>

          <div className={styles.statsGrid}>
            <div className={`${styles.statsColumn} ${styles.statsColumnLeft}`}>
              <div className={styles.statCard}>
                <p className={styles.statTitle}>Coins</p>
                <p className={styles.statPrimary}>{user.coins.toLocaleString()}</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statTitle}>Tokens</p>
                <p className={styles.statPrimary}>{user.tokens.toLocaleString()}</p>
              </div>
            </div>

            <div className={`${styles.statsColumn} ${styles.statsColumnMiddle}`}>
              <div className={`${styles.statCard} ${styles.statCardLarge}`}>
                <p className={styles.statTitle}>Games Played : {gamesPlayed}</p>
                <div className={styles.statBreakdown}>
                  <div className={styles.statBreakdownRow}>
                    <span>Wins : {wins}</span>
                    <span>Losses : {losses}</span>
                  </div>
                  <div className={styles.statBreakdownDraw}>Draw : {draws}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statTitle}>Win Rate: {winRate.toFixed(2)}%</p>
              </div>
            </div>

            <div className={`${styles.statsColumn} ${styles.statsColumnRight}`}>
              <div className={styles.statCard}>
                <p className={styles.statTitle}>Card Skin : {ownedSkins.card}</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statTitle}>Chip Skin : {ownedSkins.chip}</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statTitle}>Table Skin : {ownedSkins.table}</p>
              </div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button type="button" onClick={handleLogout} className={styles.logoutButton}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
