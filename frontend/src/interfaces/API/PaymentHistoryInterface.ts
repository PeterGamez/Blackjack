export interface PaymentHistoryInterface {
  receiptRef: string;
  type: "bank" | "truemoney";
  amount: number;
  createdAt: string;
}
