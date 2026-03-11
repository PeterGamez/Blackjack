import { InterfaceBase } from "./InterfaceBase";

export interface ProductInterface extends InterfaceBase {
    name: string;
    description: string;
    image: string;
    tokens: number;
    coins: number;
    isActive: boolean;
}
