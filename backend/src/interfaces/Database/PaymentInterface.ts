import { InterfaceBase } from "./InterfaceBase";

export interface PaymentInterface extends InterfaceBase {
    userId: number;
    receiptRef: string;
    type: "bank" | "truemoney";
    amount: number;
}
