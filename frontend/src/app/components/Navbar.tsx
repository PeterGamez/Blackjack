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
      </div>
    </div>
  );
}
