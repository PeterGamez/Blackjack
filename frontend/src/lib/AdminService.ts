import config from "@/config";

import AuthService from "./AuthService";
import LocalStorage from "./LocalStorage";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  tokens: number;
  coins: number;
  isVerified: boolean;
}

export interface AdminCode {
  id: number;
  code: string;
  amount: number;
  type: "coins" | "tokens";
  maxUses: number;
  isActive: boolean;
  expiredDate: string;
}

export interface AdminPackage {
  id: number;
  image: string;
  price: number;
  tokens: number;
  isActive: boolean;
  updatedAt: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  path: string;
  tokens: number;
  coins: number;
  type: "card" | "chip" | "table";
  isRecommend: boolean;
  isActive: boolean;
  updatedAt: string;
}

interface UpdateAdminUserPayload {
  username?: string;
  email?: string;
  role?: "user" | "admin";
  tokens?: number;
  coins?: number;
  isVerified?: boolean;
}

interface CreateAdminCodePayload {
  code: string;
  amount: number;
  type: "coins" | "tokens";
  maxUses: number;
  expiredDate: string;
}

interface UpdateAdminCodePayload {
  code?: string;
  amount?: number;
  type?: "coins" | "tokens";
  maxUses?: number;
  isActive?: boolean;
  expiredDate?: string;
}

interface CreateAdminPackagePayload {
  image: string;
  price: number;
  tokens: number;
  isActive: boolean;
}

interface UpdateAdminPackagePayload {
  image?: string;
  price?: number;
  tokens?: number;
  isActive?: boolean;
}

interface CreateAdminProductPayload {
  name: string;
  description: string;
  image: string;
  path: string;
  tokens: number;
  coins: number;
  type: "card" | "chip" | "table";
  isRecommend: boolean;
  isActive: boolean;
}

interface UpdateAdminProductPayload {
  name?: string;
  description?: string;
  image?: string;
  path?: string;
  tokens?: number;
  coins?: number;
  type?: "card" | "chip" | "table";
  isRecommend?: boolean;
  isActive?: boolean;
}

export default class AdminService {
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
        throw new Error("Session expired");
      }

      const newToken = LocalStorage.getItem("accessToken");
      if (!newToken) {
        throw new Error("Session expired");
      }

      response = await doFetch(newToken);
    }

    return response;
  }

  private static async parseError(response: Response): Promise<never> {
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      const message = data.error || data.message;
      if (message) {
        throw new Error(message);
      }
    } catch (error) {
      if (error instanceof Error && error.message) {
        throw error;
      }
    }

    if (response.status === 403) {
      throw new Error("Admin access required");
    }

    if (response.status === 404) {
      throw new Error("Resource not found");
    }

    if (response.status >= 500) {
      throw new Error("Server error");
    }

    if (response.status >= 400) {
      throw new Error("Request failed");
    }

    throw new Error("Unknown error");
  }

  public static async getUsers(): Promise<AdminUser[]> {
    const response = await this.authenticatedFetch("/admin/users", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminUser[];
  }

  public static async getUser(userId: number): Promise<AdminUser> {
    const response = await this.authenticatedFetch(`/admin/user/${userId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminUser;
  }

  public static async updateUser(userId: number, payload: UpdateAdminUserPayload): Promise<void> {
    const response = await this.authenticatedFetch(`/admin/user/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await this.parseError(response);
    }
  }

  public static async deleteUser(userId: number): Promise<void> {
    const response = await this.authenticatedFetch(`/admin/user/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await this.parseError(response);
    }
  }

  public static async getCodes(): Promise<AdminCode[]> {
    const response = await this.authenticatedFetch("/admin/codes", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminCode[];
  }

  public static async createCode(payload: CreateAdminCodePayload): Promise<number> {
    const response = await this.authenticatedFetch("/admin/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    const data = (await response.json()) as { codeId: number };
    return data.codeId;
  }

  public static async getCode(codeId: number): Promise<AdminCode> {
    const response = await this.authenticatedFetch(`/admin/code/${codeId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminCode;
  }

  public static async updateCode(codeId: number, payload: UpdateAdminCodePayload): Promise<void> {
    const response = await this.authenticatedFetch(`/admin/code/${codeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await this.parseError(response);
    }
  }

  public static async getPackages(): Promise<AdminPackage[]> {
    const response = await this.authenticatedFetch("/admin/packages", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminPackage[];
  }

  public static async createPackage(payload: CreateAdminPackagePayload): Promise<number> {
    const response = await this.authenticatedFetch("/admin/package", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    const data = (await response.json()) as { packageId: number };
    return data.packageId;
  }

  public static async getPackage(packageId: number): Promise<AdminPackage> {
    const response = await this.authenticatedFetch(`/admin/package/${packageId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminPackage;
  }

  public static async updatePackage(packageId: number, payload: UpdateAdminPackagePayload): Promise<void> {
    const response = await this.authenticatedFetch(`/admin/package/${packageId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await this.parseError(response);
    }
  }

  public static async getProducts(): Promise<AdminProduct[]> {
    const response = await this.authenticatedFetch("/admin/products", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminProduct[];
  }

  public static async createProduct(payload: CreateAdminProductPayload): Promise<void> {
    const response = await this.authenticatedFetch("/admin/product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await this.parseError(response);
    }
  }

  public static async getProduct(productId: number): Promise<AdminProduct> {
    const response = await this.authenticatedFetch(`/admin/product/${productId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await this.parseError(response);
    }

    return (await response.json()) as AdminProduct;
  }

  public static async updateProduct(productId: number, payload: UpdateAdminProductPayload): Promise<void> {
    const response = await this.authenticatedFetch(`/admin/product/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await this.parseError(response);
    }
  }
}
