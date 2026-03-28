"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import AuthService from "@lib/AuthService";

import styles from "./page.module.css";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>(null);
  const [error, setError] = useState<string>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing verification token");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const successMessage = await AuthService.verifyEmail(token);
        setMessage(successMessage);
        setTimeout(() => {
          router.push("/auth");
        }, 2000);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Server error during verification";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [searchParams, router]);

  return (
    <div className={styles.card}>
      {loading ? <p>Verifying your email...</p> : error ? <p className={styles.error}>{error}</p> : <p className={styles.success}>{message}</p>}
      {!loading && (
        <button onClick={() => router.push("/auth")} className={styles.button}>
          Go to Login
        </button>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={<p>Loading...</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
