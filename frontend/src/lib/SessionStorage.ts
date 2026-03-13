export default class SessionStorage {
    private static isBrowser() {
        return typeof window !== "undefined";
    }
    public static setItem(key: string, value: string) {
        if (this.isBrowser()) {
            sessionStorage.setItem(key, value);
        }
    }

    public static getItem(key: string): string | null {
        if (!this.isBrowser()) {
            return null;
        } else {
            return sessionStorage.getItem(key);
        }
    }

    public static removeItem(key: string) {
        if (this.isBrowser()) {
            sessionStorage.removeItem(key);
        }
    }
}