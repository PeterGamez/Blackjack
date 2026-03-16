"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import AuthService from "@/lib/AuthService";

import styles from "./reset.module.css";

function EyeIcon({ closed }: { closed: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8899bb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {closed ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "Missing password reset token");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Missing password reset token");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const successMessage = await AuthService.resetPassword(token, password);
      setMessage(successMessage);
      setTimeout(() => {
        router.push("/auth");
      }, 1800);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Server error");
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
        <h1 className={styles.title}>Set a new password</h1>
        <p className={styles.subtitle}>Choose a fresh password for your account. The reset link from your email must still be valid.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="new-password" className={styles.label}>
              New password
            </label>
            <span className={styles.hint}>Use at least 8 characters.</span>
            <div className={styles.inputWrap}>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className={`${styles.input} ${styles.inputWithIcon}`}
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className={styles.eyeButton} aria-label={showPassword ? "Hide password" : "Show password"}>
                <EyeIcon closed={!showPassword} />
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm-password" className={styles.label}>
              Confirm password
            </label>
            <div className={styles.inputWrap}>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className={`${styles.input} ${styles.inputWithIcon}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className={styles.eyeButton}
                aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}>
                <EyeIcon closed={!showConfirmPassword} />
              </button>
            </div>
          </div>

          {error && <p className={`${styles.message} ${styles.messageError}`}>{error}</p>}
          {message && <p className={`${styles.message} ${styles.messageSuccess}`}>{message}</p>}

          <div className={styles.buttonRow}>
            <button type="submit" disabled={loading || !token} className={styles.submitButton}>
              {loading ? "Saving..." : "Reset password"}
            </button>
            <button type="button" onClick={() => router.push("/auth/forgot-password")} className={styles.secondaryButton}>
              Request new link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
