import type { InterfaceBase } from "./InterfaceBase";

export interface PackageInterface extends InterfaceBase {
    image: string;
    price: number;
    tokens: number;
    isActive: boolean;
}
