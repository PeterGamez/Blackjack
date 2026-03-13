"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import config from "../../../config"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setError("Missing verification token")
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Verification failed")
        } else {
          setMessage(data.message || "Email successfully verified! You may now log in.")
          setTimeout(() => {
            router.push("/auth")
          }, 2000)
        }
      } catch (e) {
        console.error(e)
        setError("Server error during verification")
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [searchParams, router])

  return (
    <div
      style={{
        width: "400px",
        padding: "30px",
        border: "1px solid #ddd",
        background: "white",
        textAlign: "center",
      }}
    >
      {loading ? (
        <p>Verifying your email...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <p style={{ color: "green" }}>{message}</p>
      )}
      {!loading && (
        <button
          onClick={() => router.push("/auth")}
          style={{
            marginTop: "16px",
            padding: "10px 20px",
            background: "#4da6ff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go to Login
        </button>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4",
      }}
    >
      <Suspense fallback={<p>Loading...</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
