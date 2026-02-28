"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function Qmode() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) router.replace("/auth")
  }, [])

  const buttonStyle = (name: string) => ({
    width: "350px",
    padding: "200px 200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    background: "#4da6ff",
    color: "black",
    border: "3px solid #2b7cd3",
    cursor: "pointer",
    transition: "0.2s",
    whiteSpace: "nowrap",
    boxShadow:
      hovered === name
        ? "0 0 25px #4da6ff, 0 0 50px #4da6ff"
        : "0 0 10px #4da6ff",
    scale: hovered === name ? "1.03" : "1"
  })

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "30px",
      }}
    >
      <button
        onClick={() => router.push("/play")}
        style={{ position: "absolute", top: "20px", left: "20px", padding: "8px 16px", background: "#ccc", border: "none", cursor: "pointer", borderRadius: "4px", color: "black" }}
      >
        ← Back
      </button>
      <h2 style={{ margin: 0, fontSize: "28px", letterSpacing: "2px" }}>⚡ Quick Play</h2>
      <p style={{ margin: 0, color: "#aaa" }}>Play without rank pressure</p>

      <div style={{ display: "flex", gap: "40px" }}>
        <button
          onClick={() => router.push("/play/quick/dealer")}
          onMouseEnter={() => setHovered("A")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("A")}
        >
          <span style={{ display: "inline-block" }}>
            Play with Dealer
          </span>
        </button>

        <button
          onClick={() => router.push("/play/quick/player")}
          onMouseEnter={() => setHovered("B")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("B")}
        >
          <span style={{ display: "inline-block" }}>
            Play with Player
          </span>
        </button>
      </div>
    </div>
  )
}
