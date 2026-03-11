import { InterfaceBase } from "./InterfaceBase";

export interface PackageInterface extends InterfaceBase {
    name: string;
    description: string;
    price: number;
    tokens: number;
    isActive: boolean;
}
