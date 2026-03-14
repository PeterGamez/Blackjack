"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import UserService from "@lib/UserService";

import styles from "./page.module.css";

export default function Qmode() {
  const router = useRouter();

  useEffect(() => {
    UserService.getUser().then((user) => {
      if (!user) router.replace("/auth");
      else router.replace("/play");
    });
  }, [router]);

  return (
    <div className={styles.container}>
      <button onClick={() => router.push("/play")} className={styles.backButton}>
        ← Back
      </button>
      <h2 className={styles.title}>⚡ Quick Play</h2>
      <p className={styles.subtitle}>Play without rank pressure</p>

      <div className={styles.buttonRow}>
        <button onClick={() => router.push("/play/quick/dealer")} className={styles.gameButton}>
          <span className={styles.buttonLabel}>Play with Dealer</span>
        </button>

        <button onClick={() => router.push("/play/quick/player")} className={styles.gameButton}>
          <span className={styles.buttonLabel}>Play with Player</span>
        </button>
      </div>
    </div>
  );
}
