"use client";

import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PaymentService from "@lib/PaymentService";
import UserService from "@lib/UserService";
import { PaymentPackageInterface } from "@/interfaces/API/PaymentPackageInterface";

import styles from "./page.module.css";

export default function TopupPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PaymentPackageInterface[]>([]);

  useEffect(() => {
    const initPage = async () => {
      const user = await UserService.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      try {
        const paymentPackages = await PaymentService.getPackages();
        setPackages(paymentPackages);
      } catch (error) {
        console.error("Failed to load payment packages:", error);
      }
    };

    initPage();
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
          {packages.map((pkg) => (
            <div key={pkg.id} className={styles.packageCard} onClick={() => router.push(`/topup/payment?packageId=${pkg.id}&tokens=${pkg.tokens}&price=${pkg.price}`)}>
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
