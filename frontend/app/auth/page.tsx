"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import config from "../config"

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"login" | "register">("login")

  // Login state
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regUsername, setRegUsername] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [regMessage, setRegMessage] = useState("")

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

  const handleRegister = async () => {
    setRegMessage("")
    if (regPassword !== regConfirm) {
      setRegMessage("Passwords do not match")
      return
    }
    try {
      const res = await fetch(`${config.apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegMessage(data.error || "Register failed")
        return
      }
      setRegMessage("Register success! Check your email.")
      setTimeout(() => setTab("login"), 1500)
    } catch {
      setRegMessage("Server error")
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    border: "none",
    borderBottom: active ? "3px solid #3b82f6" : "3px solid transparent",
    background: "white",
    color: active ? "#3b82f6" : "#888",
    transition: "0.2s",
  })

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#d9d3c7",
      }}
    >
      <div
        style={{
          width: "380px",
          border: "2px solid #3b82f6",
          background: "white",
        }}
      >
        {/* TOP MENU */}
        <div style={{ display: "flex", borderBottom: "1px solid #ddd" }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              padding: "10px 14px",
              background: "white",
              border: "none",
              borderBottom: "3px solid transparent",
              cursor: "pointer",
              color: "#555",
              fontSize: "15px",
            }}
          >
            ← Back
          </button>
          <button style={tabStyle(tab === "register")} onClick={() => setTab("register")}>
            Register
          </button>
          <button style={tabStyle(tab === "login")} onClick={() => setTab("login")}>
            Login
          </button>
        </div>

        {/* FORM */}
        <div style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {tab === "login" ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={inputStyle}
              />
              {loginError && <div style={{ color: "red", fontSize: "13px" }}>{loginError}</div>}
              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  padding: "12px",
                  background: "#4da6ff",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                placeholder="Username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                style={inputStyle}
              />
              {regMessage && (
                <div style={{ fontSize: "13px", color: regMessage.includes("success") ? "green" : "red" }}>
                  {regMessage}
                </div>
              )}
              <button
                onClick={handleRegister}
                style={{
                  padding: "12px",
                  background: "#4da6ff",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}