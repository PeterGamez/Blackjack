import config from "@/config";
import { ProductInterface } from "@/interfaces/API/ProductInterface";

export default class ShopService {
  public static async getProducts(): Promise<ProductInterface[]> {
    const token = localStorage.getItem("accessToken");

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
}
