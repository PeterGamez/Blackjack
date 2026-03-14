"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import config from "@/config";

import styles from "./page.module.css";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        const res = await fetch(`${config.apiUrl}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Verification failed");
        } else {
          setMessage(data.message || "Email successfully verified! You may now log in.");
          setTimeout(() => {
            router.push("/auth");
          }, 2000);
        }
      } catch (e) {
        console.error(e);
        setError("Server error during verification");
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
