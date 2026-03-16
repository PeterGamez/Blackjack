"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import AuthService from "@lib/AuthService";
import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";

import config from "@/config";

import styles from "./settings.module.css";

interface PaymentHistoryItem {
  receiptRef: string;
  type: "bank" | "truemoney";
  amount: number;
  createdAt: string;
}

interface TransactionItem {
  id: string;
  date: string;
  format: string;
  amount: number;
  status: "completed";
}

interface ApiError {
  error?: string;
  message?: string;
}

interface RedeemResponse {
  message: string;
  amount: number;
  type: "coins" | "tokens";
}

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const amountFormatter = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const parseVolume = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(100, Math.max(0, parsed));
};

const normalizeError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiError;
    return data.error || data.message || "Request failed";
  } catch {
    return "Request failed";
  }
}

async function authenticatedFetch(path: string, init?: RequestInit): Promise<Response> {
  let token = LocalStorage.getItem("accessToken");

  if (!token) {
    const hasRefreshed = await AuthService.refreshAccessToken();
    if (!hasRefreshed) {
      throw new Error("Not authenticated");
    }
    token = LocalStorage.getItem("accessToken");
  }

  if (!token) {
    throw new Error("Not authenticated");
  }

  const doFetch = async (accessToken: string): Promise<Response> => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);

    return fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers,
    });
  };

  let response = await doFetch(token);

  if (response.status === 401) {
    LocalStorage.removeItem("accessToken");

    const hasRefreshed = await AuthService.refreshAccessToken();
    if (!hasRefreshed) {
      throw new Error("Session expired");
    }

    const newToken = LocalStorage.getItem("accessToken");
    if (!newToken) {
      throw new Error("Session expired");
    }

    response = await doFetch(newToken);
  }

  return response;
}

export default function SettingsPage() {
  const router = useRouter();

  const [musicVolume, setMusicVolume] = useState(70);
  const [effectVolume, setEffectVolume] = useState(75);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    UserService.getUser().then((data) => {
      if (!data) {
        router.replace("/auth");
      }
    });
  }, [router]);

  useEffect(() => {
    setMusicVolume(parseVolume(window.localStorage.getItem("musicVolume"), 70));
    setEffectVolume(parseVolume(window.localStorage.getItem("effectVolume"), 75));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("musicVolume", musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
    window.localStorage.setItem("effectVolume", effectVolume.toString());
  }, [effectVolume]);

  const loadTransactions = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const paymentResponse = await authenticatedFetch("/user/payment-history", { method: "GET", cache: "no-store" });

      if (!paymentResponse.ok) {
        throw new Error(await parseError(paymentResponse));
      }

      const paymentHistory = (await paymentResponse.json()) as PaymentHistoryItem[];

      const paymentTransactions: TransactionItem[] = paymentHistory.map((payment) => ({
        id: `payment-${payment.receiptRef}-${payment.createdAt}`,
        date: payment.createdAt,
        format: payment.type === "bank" ? "Top up (Bank Transfer)" : "Top up (TrueMoney)",
        amount: payment.amount,
        status: "completed",
      }));

      const topupTransactions = paymentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(topupTransactions);
    } catch (error) {
      setHistoryError(normalizeError(error, "Failed to load transaction history"));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const onRedeemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanCode = redeemCode.trim();
    if (!cleanCode) {
      setRedeemFeedback({ type: "error", text: "Please enter a redeem code" });
      return;
    }

    setRedeemLoading(true);
    setRedeemFeedback(null);

    try {
      const response = await authenticatedFetch("/code/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: cleanCode }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      const data = (await response.json()) as RedeemResponse;
      setRedeemFeedback({
        type: "success",
        text: `${data.message} (+${amountFormatter.format(data.amount)} ${data.type})`,
      });
      setRedeemCode("");

      const user = await UserService.getUser();
      if (user) {
        UserService.cacheUser(user);
      }
    } catch (error) {
      setRedeemFeedback({ type: "error", text: normalizeError(error, "Redeem failed") });
    } finally {
      setRedeemLoading(false);
    }
  };

  const formattedTransactions = useMemo(
    () =>
      transactions.map((item) => ({
        ...item,
        displayDate: dateFormatter.format(new Date(item.date)),
        displayAmount: `${item.amount >= 0 ? "+" : "-"}${amountFormatter.format(Math.abs(item.amount))}`,
      })),
    [transactions]
  );

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.container}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/")}>
          ← Back
        </button>

        <section className={styles.settingsCard}>
          <h1 className={styles.title}>Settings</h1>

          <div className={styles.soundRow}>
            <div className={styles.sliderBox}>
              <label htmlFor="music-volume" className={styles.sliderLabel}>
                Music Volume
              </label>
              <input id="music-volume" className={styles.slider} type="range" min={0} max={100} value={musicVolume} onChange={(event) => setMusicVolume(Number.parseInt(event.target.value, 10))} />
              <span className={styles.sliderValue}>{musicVolume}%</span>
            </div>

            <div className={styles.sliderBox}>
              <label htmlFor="effect-volume" className={styles.sliderLabel}>
                Effect Volume
              </label>
              <input id="effect-volume" className={styles.slider} type="range" min={0} max={100} value={effectVolume} onChange={(event) => setEffectVolume(Number.parseInt(event.target.value, 10))} />
              <span className={styles.sliderValue}>{effectVolume}%</span>
            </div>
          </div>

          <form className={styles.redeemRow} onSubmit={onRedeemSubmit}>
            <label htmlFor="redeem-code" className={styles.redeemLabel}>
              Redeem Code
            </label>
            <div className={styles.redeemControls}>
              <input
                id="redeem-code"
                className={styles.redeemInput}
                type="text"
                value={redeemCode}
                onChange={(event) => setRedeemCode(event.target.value)}
                placeholder="Enter your code"
                autoComplete="off"
              />
              <button type="submit" className={styles.redeemButton} disabled={redeemLoading}>
                {redeemLoading ? "Redeeming..." : "Redeem"}
              </button>
            </div>
            {redeemFeedback && <p className={redeemFeedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>{redeemFeedback.text}</p>}
          </form>

          <div className={styles.historyRow}>
            <h2 className={styles.historyTitle}>Transaction History</h2>

            <div className={styles.historyHead}>
              <span>Date</span>
              <span>Format</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            <div className={styles.historyScroll}>
              {historyLoading && <p className={styles.emptyMessage}>Loading transactions...</p>}

              {!historyLoading && historyError && <p className={styles.feedbackError}>{historyError}</p>}

              {!historyLoading && !historyError && formattedTransactions.length === 0 && <p className={styles.emptyMessage}>No transactions found.</p>}

              {!historyLoading &&
                !historyError &&
                formattedTransactions.map((transaction) => (
                  <div key={transaction.id} className={styles.historyItem}>
                    <span>{transaction.displayDate}</span>
                    <span>{transaction.format}</span>
                    <span className={transaction.amount >= 0 ? styles.amountPositive : styles.amountNegative}>{transaction.displayAmount}</span>
                    <span className={styles[`status${transaction.status[0].toUpperCase()}${transaction.status.slice(1)}`]}>{transaction.status}</span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
