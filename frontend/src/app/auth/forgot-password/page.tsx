"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthService from "@/lib/AuthService";

import styles from "./forgot.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const successMessage = await AuthService.requestPasswordReset(email);
      setMessage(successMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <button type="button" onClick={() => router.push("/auth")} className={styles.backButton}>
        ← Back to sign in
      </button>

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/logo.png" alt="Blackjack Logo" width={132} height={132} priority className={styles.logoImage} />
        </div>

        <p className={styles.eyebrow}>Account Recovery</p>
        <h1 className={styles.title}>Forgot your password?</h1>
        <p className={styles.subtitle}>Enter the email linked to your account and we will send you a reset link.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="recovery-email" className={styles.label}>
              Email address
            </label>
            <div className={styles.inputWrap}>
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className={styles.input}
              />
            </div>
          </div>

          {error && <p className={`${styles.message} ${styles.messageError}`}>{error}</p>}
          {message && <p className={`${styles.message} ${styles.messageSuccess}`}>{message}</p>}

          <div className={styles.buttonRow}>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
