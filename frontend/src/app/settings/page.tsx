"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";

import styles from "./settings.module.css";

type TransactionItem = {
  id: string;
  date: string;
  format: string;
  amount: string;
};

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const amountFormatter = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const parseVolume = (value: string): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) return 50;
  return Math.min(100, Math.max(0, parsed));
};

const normalizeError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export default function SettingsPage() {
  const router = useRouter();

  // 🔥 เพิ่ม user state
  const [user, setUser] = useState<any>(null);
  const isLoggedIn = !!user;

  const [musicVolume, setMusicVolume] = useState(() =>
    parseVolume(LocalStorage.getItem("musicVolume"))
  );
  const [effectVolume, setEffectVolume] = useState(() =>
    parseVolume(LocalStorage.getItem("effectVolume"))
  );

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // 🔥 โหลด user
  useEffect(() => {
    (async () => {
      const u = await UserService.getUser();
      setUser(u);
    })();
  }, []);

  useEffect(() => {
    LocalStorage.setItem("musicVolume", musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
    LocalStorage.setItem("effectVolume", effectVolume.toString());
  }, [effectVolume]);

  const loadTransactions = useCallback(async () => {
    if (!isLoggedIn) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const paymentHistory = await UserService.getPaymentHistorys();

      const paymentTransactions: TransactionItem[] = paymentHistory.map(
        (payment) => ({
          id: `payment-${payment.receiptRef}`,
          date: dateFormatter.format(new Date(payment.createdAt)),
          format:
            payment.type === "bank"
              ? "Top up (Bank Transfer)"
              : "Top up (TrueMoney)",
          amount: `${payment.tokens} (${payment.amount} THB)`,
        })
      );

      setTransactions(
        paymentTransactions.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (error) {
      setHistoryError(
        normalizeError(error, "Failed to load transaction history")
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const onRedeemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 🔥 กันกรณีไม่ login
    if (!isLoggedIn) {
      setRedeemFeedback({
        type: "error",
        text: "Please login first",
      });
      return;
    }

    const cleanCode = redeemCode.trim();
    if (!cleanCode) {
      setRedeemFeedback({
        type: "error",
        text: "Please enter a redeem code",
      });
      return;
    }

    setRedeemLoading(true);
    setRedeemFeedback(null);

    try {
      const data = await UserService.redeemCode(cleanCode);
      setRedeemFeedback({
        type: "success",
        text: `${data.message} (+${amountFormatter.format(
          data.amount
        )} ${data.type})`,
      });
      setRedeemCode("");

      const user = await UserService.getUser();
      if (user) {
        UserService.cacheUser(user);
      }
    } catch (error) {
      setRedeemFeedback({
        type: "error",
        text: normalizeError(error, "Redeem failed"),
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← Back
        </button>

        <section className={styles.settingsCard}>
          <h1 className={styles.title}>Settings</h1>

          {/* 🔹 Volume ปรับได้ปกติ */}
          <div className={styles.soundRow}>
            <div className={styles.sliderBox}>
              <label className={styles.sliderLabel}>Music Volume</label>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={100}
                value={musicVolume}
                onChange={(e) =>
                  setMusicVolume(Number.parseInt(e.target.value, 10))
                }
              />
              <span>{musicVolume}%</span>
            </div>

            <div className={styles.sliderBox}>
              <label className={styles.sliderLabel}>Effect Volume</label>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={100}
                value={effectVolume}
                onChange={(e) =>
                  setEffectVolume(Number.parseInt(e.target.value, 10))
                }
              />
              <span>{effectVolume}%</span>
            </div>
          </div>

          {/* 🔥 Redeem (disable ถ้าไม่ login) */}
          <form className={styles.redeemRow} onSubmit={onRedeemSubmit}>
            <label className={styles.redeemLabel}>Redeem Code</label>

            <div className={styles.redeemControls}>
              <input
                className={styles.redeemInput}
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="Enter your code"
                disabled={!isLoggedIn}
              />

              <button
                type="submit"
                className={styles.redeemButton}
                disabled={!isLoggedIn || redeemLoading}
              >
                {redeemLoading ? "Redeeming..." : "Redeem"}
              </button>
            </div>

            {!isLoggedIn && (
              <p className={styles.feedbackError}>
                Please login to use redeem
              </p>
            )}

            {redeemFeedback && (
              <p
                className={
                  redeemFeedback.type === "success"
                    ? styles.feedbackSuccess
                    : styles.feedbackError
                }
              >
                {redeemFeedback.text}
              </p>
            )}
          </form>

          {/* 🔥 History */}
          <div className={styles.historyRow}>
            <h2 className={styles.historyTitle}>
              Transaction History
            </h2>

            <div className={styles.historyScroll}>
              {!isLoggedIn && (
                <p className={styles.emptyMessage}>
                  Please login to view transactions
                </p>
              )}

              {isLoggedIn && historyLoading && (
                <p>Loading...</p>
              )}

              {isLoggedIn &&
                !historyLoading &&
                transactions.map((t) => (
                  <div key={t.id} className={styles.historyItem}>
                    <span>{t.date}</span>
                    <span>{t.format}</span>
                    <span>{t.amount}</span>
                    <span>Completed</span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}