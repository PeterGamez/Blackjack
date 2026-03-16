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
