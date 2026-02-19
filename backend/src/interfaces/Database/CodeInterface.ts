import { InterfaceBase } from "./InterfaceBase";

export interface CodeInterface extends InterfaceBase {
    code: string;
    cash: number;
    coins: number;
    usageCount: number;
    isActive: boolean;
    expiredDate: Date;
}
