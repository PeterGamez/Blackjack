"use client";

import Navbar from "@components/Navbar";
import ProfileAvatar from "@components/ProfileAvatar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LocalStorage from "@lib/LocalStorage";
import UserService from "@lib/UserService";

import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: number;
    username: string;
    email: string;
    role: string;
    coins: number;
    tokens: number;
  } | null>(null);

  useEffect(() => {
    UserService.getUser().then((data) => {
      if (data) {
        setUser(data);
        LocalStorage.setItem("coins", data.coins.toString());
        LocalStorage.setItem("tokens", data.tokens.toString());
      }
    });
  }, []);

  const handleLogout = () => {
    UserService.logout();
    router.push("/auth");
  };

  if (!user) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.emptyState}>
          <p>No profile data. Please login first.</p>
          <button type="button" onClick={() => router.push("/auth")} className={styles.primaryButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" onClick={() => router.push("/")} className={styles.backButton}>
          ← Back
        </button>
        <div className={styles.card}>
          {user.role === "admin" && (
            <button type="button" onClick={() => router.push("/admin")} className={styles.adminButton}>
              Open Admin Panel
            </button>
          )}
          <div className={styles.avatarWrapper}>
            <ProfileAvatar username={user.username} className={styles.avatar} />
          </div>
          <div className={styles.info}>
            <h1 className={styles.username}>{user.username}</h1>
            <span className={styles.roleBadge}>{user.role}</span>
            <p className={styles.email}>{user.email}</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.statPill}>
              <div>
                <p className={styles.statLabel}>Coins</p>
                <p className={styles.statValue}>{user.coins.toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.statPill}>
              <div>
                <p className={styles.statLabel}>Tokens</p>
                <p className={styles.statValue}>{user.tokens.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button type="button" onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
