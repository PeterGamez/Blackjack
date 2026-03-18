"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

const menuItems = [
  { key: "shop", label: "Shop", path: "/shop", className: styles.menuButtonShop },
  { key: "inventory", label: "Inventory", path: "/inventory", className: styles.menuButtonInventory },
  { key: "gambling", label: "Gambling", path: "/gambling", className: styles.menuButtonGambling },
  { key: "create", label: "Create Table", path: "/createtable", className: styles.menuButtonCreate },
  { key: "play", label: "Play", path: "/play", className: styles.menuButtonPlay },
] as const;

const activityItems = [
  {
    key: "new-skin",
    title: "New Skin Drop",
    subtitle: "Unlock new skins in the shop",
    action: "View Skins",
    badge: "NEW",
    path: "/shop",
  },
  {
    key: "topup-bonus",
    title: "Topup x2",
    subtitle: "Top up today and get double bonus",
    action: "Top Up Now",
    badge: "HOT",
    path: "/topup",
  },
  {
    key: "high-stake",
    title: "Prove your LUCK",
    subtitle: "Get 21 at start? That's Blackjack — earn 1.5x reward!",
    action: "Play Now",
    badge: "LIVE",
    path: "/play",
  },
] as const;

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <video autoPlay loop muted playsInline className={styles.bgVideo}>
        <source src="/videos/home-bg.mp4" type="video/mp4" />
      </video>

      <div className={styles.bgOverlay} />

      <div className={styles.content}>
        <Navbar />

        <div className={styles.placeholderWrap}>
          <section className={styles.activityBoard} aria-label="กิจกรรมเด่น">
            <div className={styles.activityHeader}>
              <p className={styles.activityEyebrow}>Lobby Board</p>
              <h2 className={styles.activityTitle}>Featured Activities</h2>
            </div>

            <div className={styles.activityList}>
              {activityItems.map((item) => (
                <button key={item.key} className={styles.activityItem} onClick={() => router.push(item.path)}>
                  <span className={styles.activityBadge}>{item.badge}</span>
                  <span className={styles.activityCopy}>
                    <span className={styles.activityItemTitle}>{item.title}</span>
                    <span className={styles.activityItemSubtitle}>{item.subtitle}</span>
                  </span>
                  <span className={styles.activityAction}>{item.action}</span>
                </button>
              ))}
            </div>
          </section>
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
