"use client"

import { useRouter } from "next/navigation"

export default function OptionB() {
  const router = useRouter()

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", justifyContent: "center", alignItems: "center", gap: 20 }}>
      <h1>Option B (placeholder)</h1>
      <button onClick={() => router.push("/ModeSelecter")} style={{ padding: "10px 16px" }}>
        Back
      </button>
    </div>
  )
}
