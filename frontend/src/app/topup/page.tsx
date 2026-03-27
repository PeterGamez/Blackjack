"use client";

import Navbar from "@components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PaymentService from "@lib/PaymentService";
import UserService from "@lib/UserService";

import { PaymentPackageInterface } from "@/interfaces/API/PaymentPackageInterface";

import styles from "./page.module.css";

export default function TopupPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PaymentPackageInterface[]>([]);

  const loadPackages = async () => {
    try {
      const paymentPackages = await PaymentService.getPackages();
      setPackages(paymentPackages);
    } catch (error) {
      console.error("Failed to load payment packages:", error);
    }
  };

  const resolvePackageImage = (image: string, tokens: number): string => {
    const imagePath = image.trim();
    const tokenBasedImage = `/topup-packages/${tokens}.png`;

    if (!imagePath) {
      return tokenBasedImage;
    }

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:") || imagePath.startsWith("blob:")) {
      return imagePath;
    }

    if (imagePath.startsWith("public/")) {
      return `/${imagePath.replace(/^public\/+/, "")}`;
    }

    if (imagePath.startsWith("/")) {
      return imagePath;
    }

    return `/${imagePath}`;
  };

  useEffect(() => {
    const initPage = async () => {
      const user = await UserService.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      await loadPackages();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadPackages();
      }
    };

    const handleFocus = () => {
      void loadPackages();
    };

    initPage();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
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
            <div key={`${pkg.id}-${pkg.image}`} className={styles.packageCard} onClick={() => router.push(`/topup/payment?packageId=${pkg.id}&tokens=${pkg.tokens}&price=${pkg.price}`)}>
              <div className={styles.packageImageWrap}>
                <Image
                  src={resolvePackageImage(pkg.image, pkg.tokens)}
                  alt={`${pkg.tokens.toLocaleString()} token package`}
                  className={styles.packageImage}
                  loading="lazy"
                  width={600}
                  height={600}
                  unoptimized={resolvePackageImage(pkg.image, pkg.tokens).startsWith("http")}
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
