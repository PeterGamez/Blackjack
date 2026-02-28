"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  username: string
  email: string
  role: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        setUser(null)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <p>No profile data. Please login first.</p>
        <button onClick={() => router.push("/login")}>Go to Login</button>
      </div>
    )
  }

  return (
    <div style={{ padding: "40px", maxWidth: "400px", margin: "100px auto", background: "white", border: "1px solid #ccc" }}>
      <h2>Profile</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <button
        onClick={handleLogout}
        style={{ marginTop: "20px", padding: "10px 20px", background: "#f44336", color: "white", border: "none", cursor: "pointer" }}
      >
        Logout
      </button>
    </div>
  )
}
