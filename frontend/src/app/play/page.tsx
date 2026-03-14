"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import UserService from "../../lib/UserService";
import Navbar from "../components/Navbar";
import styles from "./play.module.css";

export default function Home() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    UserService.getUser().then((data) => {
      if (!data) router.replace("/auth");
    });
  }, [router]);

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
      <Navbar />
      <div ref={stageRef} className={styles.stage}>
        {/* Back Button */}
        <button onClick={() => router.push("/")} className={styles.backButton}>
          ← Lobby
        </button>

        {/* Mode Title */}
        <div className={styles.modeTitle}>
          <h2>Mode</h2>
        </div>

        {/* Mode Selector Row */}
        <div className={styles.modeSelector}>
          {/* Quick Play - Player VS Dealer */}
          <button onClick={() => router.push("/play/quick/dealer")} onMouseEnter={() => setHovered("quickDealer")} onMouseLeave={() => setHovered(null)} className={getButtonClass("quickDealer")}>
            <div className={styles.buttonTitle}>Quick Play</div>
            <div className={styles.buttonSubtitle}>Player</div>
            <div className={styles.buttonSubtitle}>VS</div>
            <div className={styles.buttonSubtitle}>Dealer</div>
          </button>

          {/* Quick Play - Player VS Player */}
          <button onClick={() => router.push("/play/quick/player")} onMouseEnter={() => setHovered("quickPlayer")} onMouseLeave={() => setHovered(null)} className={getButtonClass("quickPlayer")}>
            <div className={styles.buttonTitle}>Quick Play</div>
            <div className={styles.buttonSubtitle}>Player</div>
            <div className={styles.buttonSubtitle}>VS</div>
            <div className={styles.buttonSubtitle}>Player</div>
          </button>

          {/* Rank */}
          <button onClick={() => router.push("/play/rank")} onMouseEnter={() => setHovered("rank")} onMouseLeave={() => setHovered(null)} className={getButtonClass("rank")}>
            <div className={styles.buttonTitle}>Rank</div>
          </button>
        </div>
      </div>
    </div>
  );
}
