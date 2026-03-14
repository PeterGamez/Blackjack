"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserService from "../../lib/UserService";
import ProfileAvatar from "./ProfileAvatar";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();
 
  const [username, setUsername] = useState<string>(null);
  const [coins, setCoins] = useState(0);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    setUsername(sessionStorage.getItem("cached_username"));
    setCoins(parseInt(sessionStorage.getItem("cached_coins") || "0"));
    setTokens(parseInt(sessionStorage.getItem("cached_tokens") || "0"));
  }, []);

  return (
    <div className={styles.navbar}>
      {/* Profile Section */}
      <div className={styles.profileSection} onClick={() => username ? router.push("/profile") : router.push("/auth")} style={{ cursor: "pointer" }}>
        <ProfileAvatar username={username} className={styles.profileAvatar} />
        <span className={styles.username}>{username || "Sign in"}</span>
      </div>

      {/* Resources Section */}
      <div className={styles.resourcesSection}>
        {/* Coins */}
        <div className={styles.resourceBox}>
          <span className={styles.coinIcon}>🪙</span>
          <span className={styles.resourceValue}>{coins.toLocaleString()}</span>
        </div>

        {/* Tokens */}
        <div className={styles.resourceBox}>
          <div className={styles.tokenIcon}>
            <span className={styles.tokenLetter}>T</span>
          </div>
          <span className={styles.resourceValue}>{tokens.toLocaleString()}</span>
          <button className={styles.plusButton} onClick={() => router.push("/topup")}>+</button>
        </div>
      </div>
    </div>
  );
}
