import { UserInterface } from "@interfaces/API/UserInterface";

import config from "@/config";

import LocalStorage from "./LocalStorage";
import ShopService from "./ShopService";

export default class UserService {
  private static setUser(data: UserInterface) {
    LocalStorage.setItem("userId", data.id.toString());
    LocalStorage.setItem("username", data.username);
    LocalStorage.setItem("coins", data.coins.toString());
    LocalStorage.setItem("tokens", data.tokens.toString());

    ShopService.getProducts().then((products) => {
      const ownedProducts = data.inventory.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          ...product,
          type: item.type,
        };
      });

      const cardSkin = ownedProducts.find((p) => p.type === "card" && p.path) || { path: "default" };
      const chipSkin = ownedProducts.find((p) => p.type === "chip" && p.path) || { path: "default" };
      const tableSkin = ownedProducts.find((p) => p.type === "table" && p.path) || { path: "default" };

      LocalStorage.setItem("cardSkin", cardSkin.path);
      LocalStorage.setItem("chipSkin", chipSkin.path);
      LocalStorage.setItem("tableSkin", tableSkin.path);
    });
  }

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

    const user = await this.getUser();
    this.setUser(user);
  }

  public static logout() {
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
    let token = LocalStorage.getItem("accessToken");

    if (!token) {
      const hasRefreshed = await this.refreshAccessToken();
      if (!hasRefreshed) return null;
      token = LocalStorage.getItem("accessToken");
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
          LocalStorage.removeItem("accessToken");

          const hasRefreshed = await this.refreshAccessToken();
          if (hasRefreshed) {
            const newToken = LocalStorage.getItem("accessToken");

            const retryRes = await fetch(`${config.apiUrl}/user/me`, {
              cache: "no-store",
              headers: { Authorization: `Bearer ${newToken}` },
            });

            if (retryRes.ok) {
              const user = await retryRes.json();
              this.setUser(user);
              return user;
            }
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

        LocalStorage.setItem("accessToken", refreshData.accessToken);

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
