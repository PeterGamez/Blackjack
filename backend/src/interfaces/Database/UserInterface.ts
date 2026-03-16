import type { InterfaceBase } from "./InterfaceBase";

export interface UserInterface extends InterfaceBase {
    username: string;
    email: string;
    password: string;
    role: "user" | "admin";
    tokens: number;
    coins: number;
    isVerified: boolean;
    cardId: number;
    chipId?: number | null;
    chipsId?: number | null;
    chipSkinId?: number | null;
    themeId?: number | null;
    tableId?: number | null;
}
