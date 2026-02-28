"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Gambling() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) router.replace("/auth")
  }, [router])

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#d9d3c7",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <h1 style={{ fontSize: "32px", color: "#333" }}>Coming soon</h1>
      <p style={{ color: "#666" }}>Gambling mode is under development.</p>
      <button
        onClick={() => router.push("/")}
        style={{
          padding: "10px 20px",
          background: "#4da6ff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Back to home
      </button>
    </div>
  )
}
