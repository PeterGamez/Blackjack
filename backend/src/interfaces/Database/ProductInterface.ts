import type { InterfaceBase } from "./InterfaceBase";

export interface ProductInterface extends InterfaceBase {
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
