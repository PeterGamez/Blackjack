"use client";

import Navbar from "@components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PaymentService from "@lib/PaymentService";
import UserService from "@lib/UserService";

import config from "@/config";
import { PaymentPackageInterface } from "@/interfaces/API/PaymentPackageInterface";

import styles from "./page.module.css";

export default function TopupPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PaymentPackageInterface[]>([]);

  const resolvePackageImage = (image: string): string => {
    const imagePath = image.trim();

    if (!imagePath) {
      return "/icons/token.png";
    }

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:") || imagePath.startsWith("blob:")) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return `${config.apiUrl}${imagePath}`;
    }

    return imagePath;
  };

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
              <div className={styles.packageImageWrap}>
                <Image
                  src={resolvePackageImage(pkg.image)}
                  alt={`${pkg.tokens.toLocaleString()} token package`}
                  className={styles.packageImage}
                  loading="lazy"
                  width={120}
                  height={120}
                  unoptimized={resolvePackageImage(pkg.image).startsWith("http")}
                />
              </div>
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
