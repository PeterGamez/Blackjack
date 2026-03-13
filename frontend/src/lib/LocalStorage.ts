export default class LocalStorage {
    private static isBrowser() {
        return typeof window !== "undefined";
    }
    public static setItem(key: string, value: string) {
        if (this.isBrowser()) {
            localStorage.setItem(key, value);
        }
    }

    public static getItem(key: string): string | null {
        if (!this.isBrowser()) {
            return null;
        } else {
            return localStorage.getItem(key);
        }
    }

    public static removeItem(key: string) {
        if (this.isBrowser()) {
            localStorage.removeItem(key);
        }
    }
}