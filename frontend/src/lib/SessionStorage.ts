type SessionKey = "accessToken" | "userId" | "username" | "coins" | "tokens" | "selectedCardSkin";

export default class SessionStorage {
  private static isBrowser() {
    return typeof window !== "undefined";
  }
  public static setItem(key: SessionKey, value: string) {
    if (this.isBrowser()) {
      sessionStorage.setItem(key, value);
    }
  }

  public static getItem(key: SessionKey): string {
    if (!this.isBrowser()) {
      return null;
    } else {
      return sessionStorage.getItem(key);
    }
  }

  public static removeItem(key: SessionKey) {
    if (this.isBrowser()) {
      sessionStorage.removeItem(key);
    }
  }

  public static clear() {
    if (this.isBrowser()) {
      sessionStorage.clear();
    }
  }
}
