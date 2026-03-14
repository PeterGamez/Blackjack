import config from "../config";
import { UserInterface } from "../interfaces/API/UserInterface";
import LocalStorage from "./LocalStorage";
import SessionStorage from "./SessionStorage";

export default class UserService {
  public static async login(username: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await fetch(`${config.apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    SessionStorage.setItem("accessToken", data.accessToken);
    LocalStorage.setItem("refreshToken", data.refreshToken);

    SessionStorage.setItem("userId", data.user.id.toString());
    SessionStorage.setItem("username", data.user.username);
    SessionStorage.setItem("coins", data.user.coins.toString());
    SessionStorage.setItem("tokens", data.user.tokens.toString());
    return data;
  }

  public static logout() {
    SessionStorage.clear();
    LocalStorage.clear();
  }

  public static async register(username: string, email: string, password: string): Promise<void> {
    const res = await fetch(`${config.apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Register failed");
  }

  public static async getUser(): Promise<UserInterface> {
    let token = SessionStorage.getItem("accessToken");

    if (!token) {
      const hasRefreshed = await this.refreshAccessToken();
      if (!hasRefreshed) return null;
      token = SessionStorage.getItem("accessToken");
    }

    if (token) {
      try {
        const res = await fetch(`${config.apiUrl}/user/me`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          return await res.json();
        }

        if (res.status === 401) {
          SessionStorage.removeItem("accessToken");

          const hasRefreshed = await this.refreshAccessToken();
          if (hasRefreshed) {
            const newToken = SessionStorage.getItem("accessToken");

            const retryRes = await fetch(`${config.apiUrl}/user/me`, {
              cache: "no-store",
              headers: { Authorization: `Bearer ${newToken}` },
            });

            if (retryRes.ok) return await retryRes.json();
          }
        }
      } catch (error) {
        console.error("Fetch user error:", error);
      }
    }

    return null;
  }

  private static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = LocalStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const refreshRes = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();

        SessionStorage.setItem("accessToken", refreshData.accessToken);

        if (refreshData.refreshToken) {
          LocalStorage.setItem("refreshToken", refreshData.refreshToken);
        }

        return true;
      } else {
        LocalStorage.removeItem("refreshToken");
        return false;
      }
    } catch (error) {
      console.error("Refresh token error:", error);
      return false;
    }
  }
}
