"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import UserService from "@lib/UserService";

import styles from "./page.module.css";

type GameHistoryEntry = {
  role: "player" | "dealer";
  result: "win" | "lose" | "draw";
  score: number;
  opponentScore: number;
  bet: number;
  mode: number;
  reward: number;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ProfileHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      const user = await UserService.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        router.push("/auth");
        return;
      }

      const historyData = await UserService.getGameHistory();

      if (cancelled) {
        return;
      }

      setHistory(historyData);
      setIsLoading(false);
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const stats = useMemo(() => {
    const wins = history.filter((game) => game.result === "win").length;
    const losses = history.filter((game) => game.result === "lose").length;
    const draws = history.filter((game) => game.result === "draw").length;
    const totalBet = history.reduce((sum, game) => sum + game.bet, 0);
    const netReward = history.reduce((sum, game) => sum + game.reward, 0);

    return {
      wins,
      losses,
      draws,
      totalGames: history.length,
      totalBet,
      netReward,
    };
  }, [history]);

  if (isLoading) {
    return <div className={styles.page} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <button type="button" className={styles.backButton} onClick={() => router.push("/profile")}>
            ← Profile
          </button>
          <h1 className={styles.pageTitle}>Game History</h1>
          <button type="button" className={styles.backButtonRight} onClick={() => router.push("/")}>
            Lobby →
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Games</p>
              <p className={styles.summaryValue}>{stats.totalGames}</p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>W/L/D</p>
              <p className={styles.summaryValueSmall}>
                {stats.wins} / {stats.losses} / {stats.draws}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Total Bet</p>
              <p className={styles.summaryValue}>{stats.totalBet.toLocaleString()}</p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Net Reward</p>
              <p className={`${styles.summaryValue} ${stats.netReward >= 0 ? styles.positive : styles.negative}`.trim()}>
                {stats.netReward >= 0 ? "+" : ""}
                {stats.netReward.toLocaleString()}
              </p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            {history.length === 0 ? (
              <div className={styles.emptyState}>No match history yet.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Role</th>
                    <th>Mode</th>
                    <th>Score</th>
                    <th>Bet</th>
                    <th>Reward</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr key={`${entry.createdAt}-${index}`}>
                      <td>{dateFormatter.format(new Date(entry.createdAt))}</td>
                      <td>{entry.role.toUpperCase()}</td>
                      <td>{entry.mode}</td>
                      <td>
                        {entry.score} - {entry.opponentScore}
                      </td>
                      <td>{entry.bet.toLocaleString()}</td>
                      <td className={entry.reward >= 0 ? styles.positive : styles.negative}>
                        {entry.reward >= 0 ? "+" : ""}
                        {entry.reward.toLocaleString()}
                      </td>
                      <td>
                        <span className={`${styles.resultBadge} ${styles[`result-${entry.result}`]}`.trim()}>{entry.result.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
