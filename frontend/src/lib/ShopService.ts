import config from "@config";

import { ProductInterface } from "@interfaces/API/ProductInterface";

import LocalStorage from "./LocalStorage";

export default class ShopService {
  public static async getProducts(): Promise<ProductInterface[]> {
    const token = LocalStorage.getItem("accessToken");

    const res = await fetch(`${config.apiUrl}/shop/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch products");
    }

    return data;
  }

  public static async buyProduct(productId: number, payment: "coins" | "tokens" = "coins"): Promise<void> {
    const token = LocalStorage.getItem("accessToken");

    const res = await fetch(`${config.apiUrl}/shop/buy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ productId, payment }),
    });

    const data: { message?: string; error?: string } = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || "Purchase failed");
    }
  }
}
