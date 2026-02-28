"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Qmode() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

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
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "30px"
      }}
    >
      <h2 style={{ margin: 0 }}>Quick Play</h2>

      <div style={{ display: "flex", gap: "40px" }}>
        <button
          onClick={() => router.push("/Qmode/VsDealer")}
          onMouseEnter={() => setHovered("A")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("A")}
        >
          <span style={{ display: "inline-block" }}>
            VsDealer
          </span>
        </button>

        <button
          onClick={() => router.push("/Qmode/VsPlayer")}
          onMouseEnter={() => setHovered("B")}
          onMouseLeave={() => setHovered(null)}
          style={buttonStyle("B")}
        >
          <span style={{ display: "inline-block" }}>
            VsPlayer
          </span>
        </button>
      </div>
    </div>
  )
}
