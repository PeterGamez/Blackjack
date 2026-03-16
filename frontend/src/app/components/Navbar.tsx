"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LocalStorage from "@lib/LocalStorage";

import styles from "./Navbar.module.css";
import ProfileAvatar from "./ProfileAvatar";

export default function Navbar() {
  const router = useRouter();

  const [username, setUsername] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    const readCache = () => {
      const _username = LocalStorage.getItem("username");
      if (_username) {
        setUsername(_username[0].toUpperCase() + _username.slice(1));
        setCoins(parseInt(LocalStorage.getItem("coins") || "0", 10));
        setTokens(parseInt(LocalStorage.getItem("tokens") || "0", 10));
        return;
      }

      setUsername(null);
      setCoins(0);
      setTokens(0);
    };

    readCache();

    const onStorageChange = () => readCache();
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("local-storage-change", onStorageChange);

    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("local-storage-change", onStorageChange);
    };
  }, []);

  return (
    <div className={styles.navbar}>
      {/* Profile Section */}
      <div className={styles.profileSection} onClick={() => (username ? router.push("/profile") : router.push("/auth"))} style={{ cursor: "pointer" }}>
        <ProfileAvatar username={username} className={styles.profileAvatar} />
        <span className={styles.username}>{username || "Sign in"}</span>
      </div>

      {/* Resources Section */}
      <div className={styles.resourcesSection}>
        {/* Coins */}
        <div className={styles.resourceBox}>
          <div className={styles.coinIcon}>
            <Image src="/icons/coin.png" alt="coin" width={45} height={45} />
          </div>
          <span className={styles.resourceValue}>{coins.toLocaleString()}</span>
        </div>

        {/* Tokens */}
        <div className={styles.resourceBox}>
          <div className={styles.tokenIcon}>
            <Image src="/icons/token.png" alt="token" width={45} height={45} />
          </div>
          <span className={styles.resourceValue}>{tokens.toLocaleString()}</span>
          <button className={styles.plusButton} onClick={() => router.push("/topup")}>
            +
          </button>
        </div>

        <button className={styles.settingsButton} aria-label="Open settings" onClick={() => router.push("/comingsoon")}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M12 8.75A3.25 3.25 0 1 1 8.75 12 3.25 3.25 0 0 1 12 8.75Z"
              stroke="currentColor"
              strokeWidth="1.9"
            />
            <path
              d="M20.17 10.96a1 1 0 0 0-.24-1.1l-1.06-1.06a1 1 0 0 1-.24-1.1l.39-.99a1 1 0 0 0-.54-1.29l-1.43-.6a1 1 0 0 0-1.27.45l-.52.91a1 1 0 0 1-.95.51h-1.5a1 1 0 0 1-.95-.51l-.52-.91a1 1 0 0 0-1.27-.45l-1.43.6a1 1 0 0 0-.54 1.29l.39.99a1 1 0 0 1-.24 1.1L4.07 9.86a1 1 0 0 0-.24 1.1l.41 1.03a1 1 0 0 1 0 .74l-.41 1.03a1 1 0 0 0 .24 1.1l1.06 1.06a1 1 0 0 1 .24 1.1l-.39.99a1 1 0 0 0 .54 1.29l1.43.6a1 1 0 0 0 1.27-.45l.52-.91a1 1 0 0 1 .95-.51h1.5a1 1 0 0 1 .95.51l.52.91a1 1 0 0 0 1.27.45l1.43-.6a1 1 0 0 0 .54-1.29l-.39-.99a1 1 0 0 1 .24-1.1l1.06-1.06a1 1 0 0 0 .24-1.1l-.41-1.03a1 1 0 0 1 0-.74Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
