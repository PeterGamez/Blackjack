"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import UserService from "@lib/UserService";

import styles from "./page.module.css";

interface Package {
  tokens: number;
  price: number;
}

const PACKAGES: Package[] = [
  { tokens: 350, price: 35 },
  { tokens: 1100, price: 99 },
  { tokens: 2100, price: 179 },
  { tokens: 4500, price: 349 },
  { tokens: 10000, price: 729 },
  { tokens: 28000, price: 1800 },
];

export default function TopupPage() {
  const router = useRouter();

  useEffect(() => {
    UserService.getUser().then((data) => {
      if (!data) router.replace("/auth");
    });
  }, [router]);

  return (
    <div className={styles.page}>
      <div className={styles.pageTopBar} aria-hidden="true" />
      <Navbar />

      <button onClick={() => router.push("/")} className={styles.backButton}>
        ← Lobby
      </button>

      <h1 className={styles.title}>Top Up</h1>

      <div className={styles.gridShell}>
        <div className={styles.grid}>
          {PACKAGES.map((pkg) => (
            <div key={pkg.tokens} className={styles.packageCard} onClick={() => router.push(`/topup/payment?tokens=${pkg.tokens}&price=${pkg.price}`)}>
              <div className={styles.packageInfo}>
                {pkg.tokens.toLocaleString()} Token
                <br />
                {pkg.price} Bath
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
