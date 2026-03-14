import { UserInterface } from "@interfaces/API/UserInterface";

import AuthService from "./AuthService";
import LocalStorage from "./LocalStorage";
import ShopService from "./ShopService";

export default class UserService {
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
    let token = LocalStorage.getItem("accessToken");

    if (!token) {
      const hasRefreshed = await AuthService.refreshAccessToken();
      if (!hasRefreshed) return null;
      token = LocalStorage.getItem("accessToken");
    }

    if (token) {
      try {
        const res = await AuthService.fetchCurrentUser(token);

        if (res.ok) {
          return await res.json();
        }

        if (res.status === 401) {
          LocalStorage.removeItem("accessToken");

          const hasRefreshed = await AuthService.refreshAccessToken();
          if (hasRefreshed) {
            const newToken = LocalStorage.getItem("accessToken");

            const retryRes = await AuthService.fetchCurrentUser(newToken);

            if (retryRes.ok) {
              const user = await retryRes.json();
              this.cacheUser(user);
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
}
