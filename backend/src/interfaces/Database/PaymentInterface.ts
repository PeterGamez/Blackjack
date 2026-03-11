import { CurrencyType } from "../Type";
import { InterfaceBase } from "./InterfaceBase";

export interface PaymentInterface extends InterfaceBase {
    userId: number;
    receiptRef: string;
    amount: number;
    currencyType: CurrencyType;
}
