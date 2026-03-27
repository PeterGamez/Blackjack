import config from "@/config";
import { PaymentPackageInterface } from "@/interfaces/API/PaymentPackageInterface";

import AuthService from "./AuthService";
import LocalStorage from "./LocalStorage";

export default class PaymentService {
  private static async authenticatedFetch(path: string, init?: RequestInit): Promise<Response> {
    let token = LocalStorage.getItem("accessToken");

    if (!token) {
      const hasRefreshed = await AuthService.refreshAccessToken();
      if (!hasRefreshed) {
        throw new Error("Not authenticated");
      }

      token = LocalStorage.getItem("accessToken");
    }

    if (!token) {
      throw new Error("Not authenticated");
    }

    const request = async (accessToken: string): Promise<Response> => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${accessToken}`);

      return fetch(`${config.apiUrl}${path}`, {
        ...init,
        headers,
      });
    };

    let response = await request(token);

    if (response.status === 401) {
      LocalStorage.removeItem("accessToken");

      const hasRefreshed = await AuthService.refreshAccessToken();
      if (!hasRefreshed) {
        throw new Error("Session expired");
      }

      const refreshedToken = LocalStorage.getItem("accessToken");
      if (!refreshedToken) {
        throw new Error("Session expired");
      }

      response = await request(refreshedToken);
    }

    return response;
  }

  public static async getPackages(): Promise<PaymentPackageInterface[]> {
    const response = await this.authenticatedFetch("/payment/packages", { cache: "no-store" });
    const data: PaymentPackageInterface[] | { error?: string; message?: string } = await response.json();

    if (!response.ok) {
      if ("error" in data || "message" in data) {
        throw new Error(data.error || data.message || "Failed to load payment packages");
      }

      throw new Error("Failed to load payment packages");
    }

    return data as PaymentPackageInterface[];
  }

  public static async getPackageById(packageId: number): Promise<PaymentPackageInterface> {
    const packages = await this.getPackages();
    const selectedPackage = packages.find((pkg) => pkg.id === packageId);

    if (!selectedPackage) {
      throw new Error("Package not found");
    }

    return selectedPackage;
  }

  public static async payByBankSlip(packageId: number, image: File): Promise<void> {
    const body = new FormData();
    body.append("image", image);
    body.append("packageId", packageId.toString());

    const response = await this.authenticatedFetch("/payment/bank", {
      method: "POST",
      body,
    });

    const data: { error?: string; message?: string } = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to verify bank slip");
    }
  }

  public static async payByTrueMoney(packageId: number, url: string): Promise<void> {
    const response = await this.authenticatedFetch("/payment/truemoney", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, url }),
    });

    const data: { error?: string; message?: string } = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to redeem TrueMoney voucher");
    }
  }

  public static async getQrPayload(packageId: number): Promise<string> {
    const response = await this.authenticatedFetch("/payment/qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ packageId }),
    });

    const data: { payload?: string; error?: string } = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get QR payload");
    }

    return data.payload || "";
  }
}