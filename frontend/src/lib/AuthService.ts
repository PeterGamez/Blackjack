import config from "@config";
import LocalStorage from "./LocalStorage";

export default class AuthService {
  public static async login(username: string, password: string): Promise<void> {
    const res = await fetch(`${config.apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    LocalStorage.setItem("accessToken", data.accessToken);
    LocalStorage.setItem("refreshToken", data.refreshToken);

    const UserService = (await import("./UserService")).default;
    const user = await UserService.getUser();
    if (!user) {
      throw new Error("Unable to load user profile");
    }
    UserService.cacheUser(user);
  }

  public static async register(username: string, email: string, password: string): Promise<void> {
    const res = await fetch(`${config.apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Register failed");
    }
  }

  public static async requestPasswordReset(email: string): Promise<string> {
    const res = await fetch(`${config.apiUrl}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data: { message?: string; error?: string } = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to request password reset");
    }

    return data.message || "Password reset email sent";
  }

  public static async resetPassword(token: string, password: string): Promise<string> {
    const res = await fetch(`${config.apiUrl}/auth/reset-password/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data: { message?: string; error?: string } = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to reset password");
    }

    return data.message || "Password reset successful";
  }

  public static async verifyEmail(token: string): Promise<string> {
    const res = await fetch(`${config.apiUrl}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data: { message?: string; error?: string } = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Verification failed");
    }

    return data.message || "Email successfully verified! You may now log in.";
  }

  public static async fetchCurrentUser(accessToken: string): Promise<Response> {
    return fetch(`${config.apiUrl}/user/me`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  public static async updateCurrentUser(payload: { cardId?: number; chipId?: number; tableId?: number }): Promise<void> {
    const patchCurrentUser = async (token: string): Promise<Response> => {
      return fetch(`${config.apiUrl}/user/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    };

    let token = LocalStorage.getItem("accessToken");
    if (!token) {
      const hasRefreshed = await this.refreshAccessToken();
      if (!hasRefreshed) {
        throw new Error("Not authenticated");
      }

      token = LocalStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }
    }

    let res = await patchCurrentUser(token);

    if (res.status === 401) {
      LocalStorage.removeItem("accessToken");

      const hasRefreshed = await this.refreshAccessToken();
      if (!hasRefreshed) {
        throw new Error("Session expired");
      }

      const refreshedToken = LocalStorage.getItem("accessToken");
      if (!refreshedToken) {
        throw new Error("Session expired");
      }

      res = await patchCurrentUser(refreshedToken);
    }

    const data: { error?: string; message?: string } = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || "Failed to update selected skin");
    }
  }

  public static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = LocalStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const refreshRes = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData: { accessToken: string; refreshToken?: string } = await refreshRes.json();

        LocalStorage.setItem("accessToken", refreshData.accessToken);

        if (refreshData.refreshToken) {
          LocalStorage.setItem("refreshToken", refreshData.refreshToken);
        }

        return true;
      }

      LocalStorage.removeItem("refreshToken");
      return false;
    } catch (error) {
      console.error("Refresh token error:", error);
      return false;
    }
  }
}
