"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import UserService from "../../lib/UserService";
import styles from "./ComingSoonPage.module.css";

type ComingSoonPageProps = {
  message: string;
  backPath: string;
  backLabel: string;
  variant?: "default" | "cool";
};

export default function ComingSoonPage({ message, backPath, backLabel, variant = "default" }: ComingSoonPageProps) {
  const router = useRouter();

  useEffect(() => {
    UserService.getUser().then((user) => {
      if (!user) {
        router.replace("/auth");
      }
    });
  }, [router]);

  return (
    <div className={`${styles.container} ${variant === "cool" ? styles.cool : ""}`.trim()}>
      <h1 className={styles.title}>Coming soon</h1>
      <p className={styles.message}>{message}</p>
      <button onClick={() => router.push(backPath)} className={styles.backButton}>
        {backLabel}
      </button>
    </div>
  );
}
