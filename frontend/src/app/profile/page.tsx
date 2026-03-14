"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserService from "../../lib/UserService";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);

  useEffect(() => {
    UserService.getUser().then((data) => {
      if (data) setUser(data);
    });
  }, []);

  const handleLogout = () => {
    UserService.logout();
    router.push("/auth");
  };

  if (!user) {
    return (
      <div className={styles.emptyState}>
        <Navbar />
        <button type="button" onClick={() => router.push("/")} className={styles.backButton}>
          ← Back
        </button>
        <p>No profile data. Please login first.</p>
        <button onClick={() => router.push("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <Navbar />
      <button type="button" onClick={() => router.back()} className={`${styles.backButton} ${styles.backButtonAligned}`}>
        ← Back
      </button>
      <h2>Profile</h2>
      <p>
        <strong>Username:</strong> {user.username}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.role}
      </p>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>
    </div>
  );
}
