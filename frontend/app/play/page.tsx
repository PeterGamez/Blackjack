"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function Home() {
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
    /* removed skew transform to make button normal */
    cursor: "pointer",
    transition: "0.2s",
    whiteSpace: "nowrap",
    boxShadow:
      hovered === name
        ? "0 0 25px #4da6ff, 0 0 50px #4da6ff"
        : "0 0 10px #4da6ff",
    scale: hovered === name ? "1.05" : "1"
  })

  return (
    <div
      style={{
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  gap: "50px",
}}
    >
      <button
        onClick={() => router.push("/")}
        style={{ position: "absolute", top: "20px", left: "20px", padding: "8px 16px", background: "#ccc", border: "none", cursor: "pointer", borderRadius: "4px" }}
      >
        ← Back
      </button>

      <div style={{ position: "absolute", top: "80px", textAlign: "center" }}>
        <h2 style={{ margin: 0, fontSize: "28px", letterSpacing: "2px" }}>🃏 Select Mode</h2>
        <p style={{ margin: "8px 0 0", color: "#aaa" }}>Choose how you want to play</p>
      </div>

      <button
        onClick={() => router.push("/play/quick")}
        onMouseEnter={() => setHovered("skin")}
        onMouseLeave={() => setHovered(null)}
        style={buttonStyle("skin")}
      >
        <span style={{ display: "inline-block" }}>
          QuickPlay
        </span>
      </button>
      
      <button
        onClick={() => router.push("/play/rank")}
        onMouseEnter={() => setHovered("Gambling")}
        onMouseLeave={() => setHovered(null)}
        style={buttonStyle("Gambling")}
      >
        <span style={{ display: "inline-block" }}>
          Rank
        </span>
      </button>
    </div>
  )
}