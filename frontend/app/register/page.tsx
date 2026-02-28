"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import config from "../config"

export default function RegisterPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleRegister = async () => {
    // client-side validation for matching passwords
    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    try {
      const res = await fetch(`${config.apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Register failed")
        return
      }

      setMessage("Register success! Check your email.")
      
      // จะ redirect ไป login ก็ได้
      setTimeout(() => {
        router.push("/login")
      }, 1500)

    } catch (err) {
      setMessage("Server error")
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      width: "300px",
      margin: "100px auto"
    }}>
      <h2>Register</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={handleRegister}>
        Register
      </button>

      {message && <p>{message}</p>}
    </div>
  )
}