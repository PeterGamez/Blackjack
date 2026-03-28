import { GameHistoryInterface } from "@interfaces/API/GameHistoryInterface";
import { PaymentHistoryInterface } from "@interfaces/API/PaymentHistoryInterface";
import { UserInterface } from "@interfaces/API/UserInterface";
import { CurrencyType } from "@interfaces/CurrencyType";

import config from "@config";
import AuthService from "./AuthService";
import LocalStorage from "./LocalStorage";
import ShopService from "./ShopService";

export default class UserService {
  private static async authenticatedFetch(path: string, init?: RequestInit): Promise<Response> {
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

    const currentCardSkin = LocalStorage.getItem("cardSkin") || "default";
    const currentChipSkin = LocalStorage.getItem("chipSkin") || "default";
    const currentTableSkin = LocalStorage.getItem("tableSkin") || "default";

    ShopService.getProducts().then((products) => {
      const ownedProducts = data.inventory.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          ...product,
          type: item.type,
        };
      });

      const resolveSkinPath = (type: "card" | "chip" | "table", selectedId: number, currentSkin: string): string => {
        if (selectedId === null || selectedId === 0) {
          return "default";
        }

        if (typeof selectedId === "number" && selectedId > 0) {
          const selectedProduct = ownedProducts.find((p) => p.type === type && p.id === selectedId && p.path);
          return selectedProduct?.path || currentSkin;
        }

        return currentSkin;
      };

      LocalStorage.setItem("cardSkin", resolveSkinPath("card", data.cardId, currentCardSkin));
      LocalStorage.setItem("chipSkin", resolveSkinPath("chip", data.chipId, currentChipSkin));
      LocalStorage.setItem("tableSkin", resolveSkinPath("table", data.tableId, currentTableSkin));
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

  public static async getGameHistory(): Promise<GameHistoryInterface[]> {
    try {
      const response = await this.authenticatedFetch("/user/game-history", { cache: "no-store" });

      if (!response?.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Fetch game history error:", error);
      return [];
    }
  }

  public static async getPaymentHistorys(): Promise<PaymentHistoryInterface[]> {
    try {
      const response = await this.authenticatedFetch("/user/payment-history", { cache: "no-store" });

      if (!response?.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Fetch payment history error:", error);
      return [];
    }
  }

  public static async redeemCode(code: string): Promise<{ message: string; amount: number; type: CurrencyType }> {
    try {
      const response = await this.authenticatedFetch("/code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response?.ok) {
        const data: { error?: string; message?: string } = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Redeem code failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Redeem code error:", error);
      throw error;
    }
  }

  public static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();

    if (!trimmedCurrentPassword || !trimmedNewPassword) {
      throw new Error("Current password and new password are required");
    }

    const response = await this.authenticatedFetch("/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: trimmedCurrentPassword, newPassword: trimmedNewPassword }),
    });

    if (!response) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      let errorMessage = "Failed to update password";

      try {
        const payload = (await response.json()) as { error?: string };
        if (payload?.error) {
          errorMessage = payload.error;
        }
      } catch {
        // Keep fallback message when response has no JSON payload.
      }

      throw new Error(errorMessage);
    }
  }
}
