type LocalKey = "accessToken" | "refreshToken" | "userId" | "username" | "coins" | "tokens" | "cardSkin" | "chipSkin" | "tableSkin";

export default class LocalStorage {
  private static isBrowser() {
    return typeof window !== "undefined";
  }
  public static setItem(key: LocalKey, value: string) {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
      window.dispatchEvent(new CustomEvent("local-storage-change", { detail: { key, value } }));
    }
  }

  public static getItem(key: LocalKey): string {
    if (!this.isBrowser()) {
      return null;
    } else {
      return localStorage.getItem(key);
    }
  }

  public static removeItem(key: LocalKey) {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent("local-storage-change", { detail: { key, value: null } }));
    }
  }

  public static clear() {
    if (this.isBrowser()) {
      localStorage.clear();
      window.dispatchEvent(new CustomEvent("local-storage-change", { detail: { key: null, value: null } }));
    }
  }
}
