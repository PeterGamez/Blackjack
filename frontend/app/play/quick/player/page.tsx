"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Player() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) router.replace("/auth")
  }, [])

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <button
        onClick={() => router.push("/play/quick")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "8px 16px",
          background: "#ccc",
          border: "none",
          cursor: "pointer",
          borderRadius: "4px",
          color: "black",
        }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: "48px", margin: 0 }}>🚧</h1>
      <h2 style={{ fontSize: "32px", margin: 0, letterSpacing: "2px" }}>Coming Soon</h2>
      <p style={{ color: "#aaa", margin: 0 }}>Vs Player (Quick) is under construction. Stay tuned!</p>
    </div>
  )
}
