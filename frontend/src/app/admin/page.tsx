"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserService from "@lib/UserService";

import Navbar from "../components/Navbar";
import styles from "./page.module.css";

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const checkPermission = async () => {
      const currentUser = await UserService.getUser();

      if (!currentUser) {
        router.push("/auth");
        return;
      }

      if (currentUser.role !== "admin") {
        router.push("/profile");
        return;
      }

      setStatus("ready");
    };

    checkPermission();
  }, [router]);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingState}>Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <button type="button" onClick={() => router.push("/profile")} className={styles.backButton}>
          ← Back to Profile
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Choose a management menu.</p>

          <div className={styles.menuGrid}>
            <Link href="/admin/user" className={styles.menuCard}>
              <h2>User Management</h2>
              <p>View all users and edit player data.</p>
            </Link>

            <Link href="/admin/code" className={styles.menuCard}>
              <h2>Code Management</h2>
              <p>View all codes, create new codes, and edit existing codes.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
