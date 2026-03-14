"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import UserService from "../../lib/UserService";
import styles from "./page.module.css";

function EyeIcon({ closed }: { closed: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8899bb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regMessage, setRegMessage] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const switchTab = (nextTab: "login" | "register") => {
    if (nextTab === tab) return;
    setSlideDirection(nextTab === "register" ? "left" : "right");
    setTab(nextTab);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await UserService.login(loginUsername, loginPassword);
      router.push("/");
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Server error");
    }
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage("");
    if (regPassword !== regConfirm) {
      setRegMessage("Passwords do not match");
      return;
    }
    setRegLoading(true);
    try {
      await UserService.register(regUsername, regEmail, regPassword);
      setRegMessage("Register success! Check your email.");
      setTimeout(() => switchTab("login"), 1500);
    } catch (err: unknown) {
      setRegMessage(err instanceof Error ? err.message : "Server error");
    }
    setRegLoading(false);
  };

  return (
    <div className={styles.page}>
      <button type="button" onClick={() => router.push("/")} className={styles.backButton}>
        ← Lobby
      </button>

      <div className={`${styles.shell} ${tab === "register" ? styles.shellRegister : styles.shellLogin}`}>
        <div className={styles.avatar} />

        <div className={styles.tabs}>
          <div className={`${styles.tabIndicator} ${tab === "register" ? styles.tabIndicatorRegister : ""}`} />
          <button onClick={() => switchTab("login")} className={`${styles.tabButton} ${tab === "login" ? styles.tabButtonActive : ""}`}>
            Sign in
          </button>
          <button onClick={() => switchTab("register")} className={`${styles.tabButton} ${tab === "register" ? styles.tabButtonActive : ""}`}>
            Sign up
          </button>
        </div>

        <div key={tab} className={`${styles.formWrap} ${slideDirection === "left" ? styles.slideFromRight : styles.slideFromLeft}`}>
          {tab === "login" ? (
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.fieldLabelLarge}>Username</label>
                <div className={styles.inputWrap}>
                  <input type="text" placeholder="username/email" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required className={styles.input} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabelLarge}>Password</label>
                <div className={styles.inputWrap}>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                  <button type="button" onClick={() => setShowLoginPassword((v) => !v)} className={styles.eyeButton}>
                    <EyeIcon closed={!showLoginPassword} />
                  </button>
                </div>
              </div>

              {loginError && <div className={styles.messageError}>{loginError}</div>}

              <button type="submit" disabled={loginLoading} className={`${styles.submitButton} ${styles.signInButton}`}>
                {loginLoading ? "SIGNING IN..." : "SIGN IN"}
              </button>

              <button type="button" onClick={() => router.push("/comingsoon")} className={styles.linkButton}>
                Forgot Password
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.gridForm}>
                <div className={styles.field}>
                  <label className={styles.fieldLabelLarge}>Username</label>
                  <div className={styles.inputWrap}>
                    <input placeholder="username/email" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required className={styles.input} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={`${styles.fieldLabelLarge} ${styles.passwordLabel}`}>
                    Password
                    <span className={styles.passwordHint}>At Least 8 Characters: A–Z, a–z, 0–9, Symbols.</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className={`${styles.input} ${styles.inputWithIcon}`}
                    />
                    <button type="button" onClick={() => setShowRegPassword((v) => !v)} className={styles.eyeButton}>
                      <EyeIcon closed={!showRegPassword} />
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  <div className={styles.inputWrap}>
                    <input placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className={styles.input} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Confirm Password</label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showRegConfirm ? "text" : "password"}
                      placeholder="password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                      className={`${styles.input} ${styles.inputWithIcon}`}
                    />
                    <button type="button" onClick={() => setShowRegConfirm((v) => !v)} className={styles.eyeButton}>
                      <EyeIcon closed={!showRegConfirm} />
                    </button>
                  </div>
                </div>
              </div>

              {regMessage && <div className={regMessage.includes("success") ? styles.messageSuccess : styles.messageError}>{regMessage}</div>}

              <div className={styles.createButtonWrap}>
                <button type="submit" disabled={regLoading} className={`${styles.submitButton} ${styles.createButton}`}>
                  {regLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
