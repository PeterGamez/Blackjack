import config from "../config"
import { UserInterface } from "../interfaces/API/UserInterface"
import LocalStorage from "./LocalStorage"
import SessionStorage from "./SessionStorage"

export default class UserService {
    public static setAccessToken(token: string) {
        SessionStorage.setItem("accessToken", token)
    }

    public static clearAccessToken() {
        SessionStorage.removeItem("accessToken")
    }

    public static setRefreshToken(token: string) {
        LocalStorage.setItem("refreshToken", token)
    }

    public static clearRefreshToken() {
        LocalStorage.removeItem("refreshToken")
    }

    public static getAccessToken(): string | null {
        return SessionStorage.getItem("accessToken")
    }

    public static logout() {
        this.clearAccessToken()
        this.clearRefreshToken()
        LocalStorage.removeItem("cached_username")
        LocalStorage.removeItem("cached_coins")
        LocalStorage.removeItem("cached_tokens")
    }

    public static async login(username: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
        const res = await fetch(`${config.apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Login failed")
        this.setAccessToken(data.accessToken)
        this.setRefreshToken(data.refreshToken)
        return data
    }

    public static async register(username: string, email: string, password: string): Promise<void> {
        const res = await fetch(`${config.apiUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Register failed")
    }

    public static async getUser(): Promise<UserInterface | null> {
        let token = SessionStorage.getItem("accessToken")

        if (!token) {
            const hasRefreshed = await this.refreshAccessToken()
            if (!hasRefreshed) return null
            token = SessionStorage.getItem("accessToken")
        }

        if (token) {
            try {
                const res = await fetch(`${config.apiUrl}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                if (res.ok) {
                    return await res.json()
                }

                if (res.status === 401) {
                    this.clearAccessToken()

                    const hasRefreshed = await this.refreshAccessToken()
                    if (hasRefreshed) {
                        const newToken = SessionStorage.getItem("accessToken")

                        const retryRes = await fetch(`${config.apiUrl}/user/me`, {
                            headers: { Authorization: `Bearer ${newToken}` },
                        })

                        if (retryRes.ok) return await retryRes.json()
                    }
                }
            } catch (error) {
                console.error("Fetch user error:", error)
            }
        }

        return null
    }

    private static async refreshAccessToken(): Promise<boolean> {
        const refreshToken = LocalStorage.getItem("refreshToken")
        if (!refreshToken) return false

        try {
            const refreshRes = await fetch(`${config.apiUrl}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            })

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json()

                this.setAccessToken(refreshData.accessToken)

                if (refreshData.refreshToken) {
                    this.setRefreshToken(refreshData.refreshToken)
                }

                return true
            } else {
                this.clearRefreshToken()
                return false
            }
        } catch (error) {
            console.error("Refresh token error:", error)
            return false
        }
    }
}
