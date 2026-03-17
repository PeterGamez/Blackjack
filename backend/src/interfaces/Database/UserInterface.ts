import type { InterfaceBase } from "./InterfaceBase";

export interface UserInterface extends InterfaceBase {
    username: string;
    email: string;
    password: string;
    role: "user" | "vip" | "admin";
    tokens: number;
    coins: number;
    isVerified: boolean;
    cardId: number;
    chipId: number;
    tableId: number;
}
