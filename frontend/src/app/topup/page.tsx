"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import config from "../../config"
import UserService from "../../lib/UserService"

interface Package {
    tokens: number
    price: number
}

const PACKAGES: Package[] = [
    { tokens: 350, price: 35 },
    { tokens: 1100, price: 99 },
    { tokens: 2100, price: 179 },
    { tokens: 4500, price: 349 },
    { tokens: 10000, price: 729 },
    { tokens: 28000, price: 1800 },
]

export default function TopupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tokens, setTokens] = useState<number>(0)
    const [coins, setCoins] = useState<number>(0)
    const [username, setUsername] = useState<string>("")
    // tabs removed, always show packages

    const loadProfile = async () => {
        try {
            const data = await UserService.getUser()
            if (!data) {
                router.replace("/auth")
                return
            }
            setUsername(data.username || "")
            if (typeof data.coins === "number") {
                setCoins(data.coins)
            }
            if (typeof data.tokens === "number") {
                setTokens(data.tokens)
            }
        } catch (err) {
            console.error("failed to load profile", err)
        }
    }

    useEffect(() => {
        const cached = sessionStorage.getItem("cached_tokens")
        if (cached) {
            setTokens(Number(cached))
        }

        // load coins/username as well
        const cachedUsername = sessionStorage.getItem("cached_username")
        const cachedCoins = sessionStorage.getItem("cached_coins")
        if (cachedUsername) setUsername(cachedUsername)
        if (cachedCoins) setCoins(Number(cachedCoins))

        loadProfile()
    }, [router])

    useEffect(() => {
        if (username) sessionStorage.setItem("cached_username", username)
        if (coins > 0) sessionStorage.setItem("cached_coins", coins.toString())
        if (tokens > 0) sessionStorage.setItem("cached_tokens", tokens.toString())
    }, [username, coins, tokens])

    const handlePurchase = async (amount: number) => {
        setError(null)
        setLoading(true)
        try {
            const token = sessionStorage.getItem("accessToken")
            if (!token) {
                router.replace("/auth")
                return
            }

            const res = await fetch(`${config.apiUrl}/payment/purchase`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount, method: "manual" }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Failed to complete purchase")
            }

            const newTokens = typeof data.tokens === "number" ? data.tokens : tokens + amount
            setTokens(newTokens)
            sessionStorage.setItem("cached_tokens", newTokens.toString())
            alert("Purchase successful!")
        } catch (err: any) {
            console.error("topup error", err)
            setError(err.message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                background: "#f0f2f5",
                minHeight: "100vh",
                paddingTop: "120px",
                position: "relative",
            }}
        >
            {/* header bar */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem 3rem",
                    background: "rgba(30, 36, 48, 0.95)",
                    backdropFilter: "blur(10px)",
                    gap: "2rem",
                    height: "183px",
                    boxSizing: "border-box",
                    zIndex: 100,
                }}
            >
                <div
                    onClick={() => router.push(username ? "/profile" : "/auth")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        gap: 0,
                        background: "rgba(92, 107, 138, 0.6)",
                        border: "1px solid rgba(92, 107, 138, 0.8)",
                        borderRadius: "20px",
                        padding: "8px 24px 8px 0",
                        height: "64px",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            border: "3px solid #5c6b8a",
                            zIndex: 2,
                            marginLeft: "-20px",
                            marginRight: "12px",
                        }}
                    />
                    <div
                        style={{
                            color: "#e6eaf2",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "18px",
                            fontWeight: 400,
                        }}
                    >
                        {username || "username"}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div
                        style={{
                            height: "64px",
                            minWidth: "220px",
                            borderRadius: "20px",
                            background: "rgba(92, 107, 138, 0.6)",
                            border: "1px solid rgba(92, 107, 138, 0.8)",
                            color: "#e6eaf2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: "16px",
                            fontSize: "18px",
                            padding: "0 24px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                        onClick={() => router.push("/topup")}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(92, 107, 138, 0.8)"
                            e.currentTarget.style.transform = "translateY(-2px)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(92, 107, 138, 0.6)"
                            e.currentTarget.style.transform = "translateY(0)"
                        }}
                    >
                        <span style={{ fontSize: "20px" }}>🪙</span>
                        {coins.toLocaleString()}
                    </div>

                    <div
                        style={{
                            height: "64px",
                            minWidth: "220px",
                            borderRadius: "20px",
                            background: "rgba(92, 107, 138, 0.6)",
                            border: "1px solid rgba(92, 107, 138, 0.8)",
                            color: "#e6eaf2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: "16px",
                            fontSize: "18px",
                            padding: "0 24px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                        onClick={() => router.push("/topup")}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(92, 107, 138, 0.8)"
                            e.currentTarget.style.transform = "translateY(-2px)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(92, 107, 138, 0.6)"
                            e.currentTarget.style.transform = "translateY(0)"
                        }}
                    >
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                background: "#b28bff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "#1a1a1a",
                            }}
                        >
                            T
                        </div>
                        {tokens.toLocaleString()}
                        <span style={{ fontSize: "28px", lineHeight: 1, marginLeft: "auto", fontWeight: 700 }}>+</span>
                    </div>
                </div>
            </div>

            <button
  onClick={() => router.push("/")}
  style={{
    position: "absolute",
    top: "210px",
    left: "30px",
    padding: "16px 24px",
    background: "#d4a74a",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
    fontSize: "14px",
    transition: "all 0.2s ease"
  }}
  onMouseEnter={(e)=>{
    e.currentTarget.style.transform="translateY(-2px)"
    e.currentTarget.style.background="#f0d79b"
  }}
  onMouseLeave={(e)=>{
    e.currentTarget.style.transform="translateY(0)"
    e.currentTarget.style.background="#e3c786"
  }}
>

                ← Lobby
            </button>
            
            <h1
    style={{
        textAlign: "center",
        fontSize: "1.8rem",
        position: "relative",
        top: "120px",
    }}
>
    Top Up
</h1>

            <div
  style={{
    maxWidth: "800px",
    width: "98%",
    margin: "170px auto 0",
    padding: "24px",
    background: "#e3c786e6",
    borderRadius: "20px",
    display: "flex",
    justifyContent: "center",
  }}
>

                <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "28px",
    width: "100%",
  }}
>
                    {PACKAGES.map((pkg) => (
   <div
  key={pkg.tokens}
  style={{
    background:
      "linear-gradient(180deg, #2A3447 0%, #2A3447 70%, #6C7FA3 70%, #6C7FA3 100%)",
    borderRadius: "18px",
    height: "200px",
    width: "100%",
    maxWidth: "280px",
    padding: "10px",
    color: "#ffffff",
    position: "relative",
    overflow: "hidden",
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  }}
                            onClick={() => {
    if (loading) return
    router.push(`/payment?tokens=${pkg.tokens}&price=${pkg.price}`)
}}
                        >
                             <div
    style={{
      position: "absolute",
      bottom: 5,
      left: 0,
      right: 0,
      textAlign: "center",
      fontWeight: 600,
    }}
                            >
                                {pkg.tokens.toLocaleString()} Token
                                <br />
                                {pkg.price} Bath
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
