import type { CurrencyType } from "../Type";
import type { InterfaceBase } from "./InterfaceBase";

export interface CodeInterface extends InterfaceBase {
    code: string;
    amount: number;
    type: CurrencyType;
    maxUses: number;
    isActive: boolean;
    expiredDate: Date;
}
