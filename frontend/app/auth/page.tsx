"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import config from "../config"

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left")

  // Login state
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register state
  const [regUsername, setRegUsername] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [regMessage, setRegMessage] = useState("")
  const [regLoading, setRegLoading] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [isBackHovered, setIsBackHovered] = useState(false)

  const switchTab = (nextTab: "login" | "register") => {
    if (nextTab === tab) return
    setSlideDirection(nextTab === "register" ? "left" : "right")
    setTab(nextTab)
  }

  const goldGradient = "linear-gradient(48.01deg, #f2c879 11.6%, #ecc06b 30.8%, #c99a3f 50%, #e6b85c 69.2%, #f2c879 88.4%)"
  const btnStyle = (key: string, disabled: boolean): React.CSSProperties => ({
    border: "none",
    borderRadius: "50px",
    color: "#1a2234",
    fontWeight: "700",
    fontSize: "22px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
    letterSpacing: "0.5px",
    background: disabled ? "#a07830" : goldGradient,
    boxShadow: hoveredBtn === key && !disabled
      ? "0px 18px 24px rgba(0,0,0,0.25), 0 0 28px rgba(255,255,255,0.5), 0 0 55px rgba(255,255,255,0.25)"
      : "0px 4px 12px rgba(0,0,0,0.15), inset 0px 1px 2px rgba(255,255,255,0.2)",
    transform: hoveredBtn === key && !disabled ? "translateY(-4px) scale(1.04)" : "none",
    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)
    try {
      const res = await fetch(`${config.apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error || "Login failed")
        setLoginLoading(false)
        return
      }
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user))
      router.push("/")
    } catch {
      setLoginError("Server error")
    }
    setLoginLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegMessage("")
    if (regPassword !== regConfirm) {
      setRegMessage("Passwords do not match")
      return
    }
    setRegLoading(true)
    try {
      const res = await fetch(`${config.apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegMessage(data.error || "Register failed")
        setRegLoading(false)
        return
      }
      setRegMessage("Register success! Check your email.")
      setTimeout(() => switchTab("login"), 1500)
    } catch {
      setRegMessage("Server error")
    }
    setRegLoading(false)
  }

  
  const inputWrapStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "20px 22px",
    background: "#3d4f6e",
    border: "none",
    borderRadius: "11px",
    color: "#c8d0e0",
    fontSize: "21px",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    color: "#c8d0e0",
    fontSize: "21px",
    marginBottom: "9px",
    display: "block",
  }

  const EyeIcon = ({ closed }: { closed: boolean }) => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8899bb"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
  )

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#1a2234",
      }}
    >
      <button
        type="button"
        onClick={() => router.push("/")}
        onMouseEnter={() => setIsBackHovered(true)}
        onMouseLeave={() => setIsBackHovered(false)}
        style={{
          position: "fixed",
          top: "70px",
          left: "70px",
          background: isBackHovered ? "rgba(92, 107, 138, 0.6)" : "transparent",
          border: "none",
          color: "#e6eaf2",
          fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
          cursor: "pointer",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          fontWeight: 400,
          letterSpacing: "1px",
          textTransform: "uppercase",
          zIndex: 50,
          transform: isBackHovered ? "translateX(-5px)" : "translateX(0)",
          transition: "all 0.3s ease",
        }}
      >
        ← Lobby
      </button>

      <div
        style={{
          width: tab === "register" ? "900px" : "578px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 28px",
          transition: "width 0.3s ease",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "152px",
            height: "152px",
            borderRadius: "50%",
            background: "#c8cfd8",
            marginBottom: "44px",
          }}
        />

        {/* Tabs */}
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: "290px",
            marginBottom: "50px",
            alignItems: "end",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "50%",
              height: "2px",
              background: "#d4a84b",
              transform: tab === "register" ? "translateX(100%)" : "translateX(0)",
              transition: "transform 0.28s ease",
            }}
          />
          <button
            onClick={() => switchTab("login")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "25px",
              fontWeight: tab === "login" ? "600" : "400",
              color: tab === "login" ? "#d4a84b" : "#93a3bb",
              borderBottom: "2px solid transparent",
              paddingBottom: "9px",
              transition: "color 0.28s ease",
            }}
          >
            Sign in
          </button>
          <button
            onClick={() => switchTab("register")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "25px",
              fontWeight: tab === "register" ? "600" : "400",
              color: tab === "register" ? "#d4a84b" : "#93a3bb",
              borderBottom: "2px solid transparent",
              paddingBottom: "9px",
              transition: "color 0.28s ease",
            }}
          >
            Sign up
          </button>
        </div>

        {/* Forms */}
        <div
          key={tab}
          style={{
            width: "100%",
            animation: `${slideDirection === "left" ? "slideInFromRight" : "slideInFromLeft"} 0.28s ease`,
          }}
        >
          {tab === "login" ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <div>
                <label style={labelStyle}>Username</label>
                <div style={inputWrapStyle}>
                  <input
                    type="text"
                    placeholder="username/email"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={inputWrapStyle}>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: "64px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "20px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <EyeIcon closed={!showLoginPassword} />
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ color: "#ff6b6b", fontSize: "18px", textAlign: "center" }}>{loginError}</div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                onMouseEnter={() => setHoveredBtn("signin")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{ marginTop: "11px", padding: "20px", ...btnStyle("signin", loginLoading) }}
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/auth/verify")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#93a3bb",
                  fontSize: "17px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  marginTop: "6px",
                }}
              >
                Forget Password
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* 2-column grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "28px 40px",
                }}
              >
                {/* Username */}
                <div>
                  <label style={labelStyle}>Username</label>
                  <div style={inputWrapStyle}>
                    <input
                      placeholder="username/email"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ ...labelStyle, display: "flex", alignItems: "baseline", gap: "10px" }}>
                    Password
                    <span style={{ fontSize: "13px", color: "#8899bb", fontWeight: "400" }}>
                      At Least 8 Characters: A–Z, a–z, 0–9, Symbols.
                    </span>
                  </label>
                  <div style={inputWrapStyle}>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      style={{ ...inputStyle, paddingRight: "64px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((v) => !v)}
                      style={{
                        position: "absolute",
                        right: "20px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <EyeIcon closed={!showRegPassword} />
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <div style={inputWrapStyle}>
                    <input
                      placeholder="Email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={inputWrapStyle}>
                    <input
                      type={showRegConfirm ? "text" : "password"}
                      placeholder="password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                      style={{ ...inputStyle, paddingRight: "64px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirm((v) => !v)}
                      style={{
                        position: "absolute",
                        right: "20px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <EyeIcon closed={!showRegConfirm} />
                    </button>
                  </div>
                </div>
              </div>

              {regMessage && (
                <div
                  style={{
                    fontSize: "18px",
                    textAlign: "center",
                    color: regMessage.includes("success") ? "#4ade80" : "#ff6b6b",
                  }}
                >
                  {regMessage}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center", marginTop: "11px" }}>
                <button
                  type="submit"
                  disabled={regLoading}
                  onMouseEnter={() => setHoveredBtn("signup")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{ padding: "20px 80px", ...btnStyle("signup", regLoading) }}
                >
                  {regLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          )}
        </div>
        <style jsx>{`
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(44px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-44px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}