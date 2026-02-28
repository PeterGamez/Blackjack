"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Home() {
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
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  gap: "50px"
}}
    >
      <button
        onClick={() => router.push("/Qmode")}
        onMouseEnter={() => setHovered("skin")}
        onMouseLeave={() => setHovered(null)}
        style={buttonStyle("skin")}
      >
        <span style={{ display: "inline-block" }}>
          QuickPlay
        </span>
      </button>
      
      <button
        onClick={() => router.push("/Gambling")}
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