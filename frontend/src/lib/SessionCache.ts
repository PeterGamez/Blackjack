import { CachedProfile } from "../interfaces/CachedProfile";

export default class SessionCache {
  private static readonly EMPTY_PROFILE: CachedProfile = {
    username: "",
    coins: 0,
    tokens: 0,
  };

  private static toNumber(value: string | null): number {
    if (!value) return 0;
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  public static getCachedProfileSnapshot(): CachedProfile {
    if (typeof window === "undefined") {
      return this.EMPTY_PROFILE;
    }

    return {
      username: sessionStorage.getItem("cached_username") || "",
      coins: this.toNumber(sessionStorage.getItem("cached_coins")),
      tokens: this.toNumber(sessionStorage.getItem("cached_tokens")),
    };
  }

  public static persistCachedProfile(profile: Partial<CachedProfile>): void {
    if (typeof window === "undefined") {
      return;
    }

    if (profile.username) {
      sessionStorage.setItem("cached_username", profile.username);
    }

    if (typeof profile.coins === "number" && profile.coins > 0) {
      sessionStorage.setItem("cached_coins", profile.coins.toString());
    }

    if (typeof profile.tokens === "number" && profile.tokens > 0) {
      sessionStorage.setItem("cached_tokens", profile.tokens.toString());
    }
  }
}
