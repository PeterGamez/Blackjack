import { InterfaceBase } from "./InterfaceBase";

export interface CodeInterface extends InterfaceBase {
    code: string;
    amount: number;
    type: "cash" | "coins";
    usageCount: number;
    isActive: boolean;
    expiredDate: Date;
}
