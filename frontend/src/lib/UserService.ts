import config from "@/config";

import { UserInterface } from "@interfaces/API/UserInterface";

import AuthService from "./AuthService";
import LocalStorage from "./LocalStorage";
import ShopService from "./ShopService";

export default class UserService {
  private static async authenticatedFetch(path: string, init?: RequestInit): Promise<Response | null> {
    let token = LocalStorage.getItem("accessToken");

    if (!token) {
      const hasRefreshed = await AuthService.refreshAccessToken();
      if (!hasRefreshed) {
        return null;
      }

      token = LocalStorage.getItem("accessToken");
    }

    if (!token) {
      return null;
    }

    const doFetch = async (accessToken: string): Promise<Response> => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${accessToken}`);

      return fetch(`${config.apiUrl}${path}`, {
        ...init,
        headers,
      });
    };

    let response = await doFetch(token);

    if (response.status === 401) {
      LocalStorage.removeItem("accessToken");

      const hasRefreshed = await AuthService.refreshAccessToken();
      if (!hasRefreshed) {
        return null;
      }

      const refreshedToken = LocalStorage.getItem("accessToken");
      if (!refreshedToken) {
        return null;
      }

      response = await doFetch(refreshedToken);
    }

    return response;
  }

  public static cacheUser(data: UserInterface) {
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

  public static logout() {
    LocalStorage.clear();
  }

  public static async getUser(): Promise<UserInterface> {
    try {
      const res = await this.authenticatedFetch("/user/me", { cache: "no-store" });

      if (res?.ok) {
        const user = (await res.json()) as UserInterface;
        this.cacheUser(user);
        return user;
      }
    } catch (error) {
      console.error("Fetch user error:", error);
    }

    return null;
  }

  public static async getGameHistory(): Promise<
    Array<{
      role: "player" | "dealer";
      result: "win" | "lose" | "draw";
      score: number;
      opponentScore: number;
      bet: number;
      mode: number;
      reward: number;
      createdAt: string;
    }>
  > {
    try {
      const response = await this.authenticatedFetch("/user/game-history", { cache: "no-store" });

      if (!response?.ok) {
        return [];
      }

      return (await response.json()) as Array<{
        role: "player" | "dealer";
        result: "win" | "lose" | "draw";
        score: number;
        opponentScore: number;
        bet: number;
        mode: number;
        reward: number;
        createdAt: string;
      }>;
    } catch (error) {
      console.error("Fetch game history error:", error);
      return [];
    }
  }
}
