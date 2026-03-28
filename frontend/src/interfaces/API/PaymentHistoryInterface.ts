export interface PaymentHistoryInterface {
  receiptRef: string;
  type: "bank" | "truemoney";
  amount: number;
  tokens: number;
  createdAt: string;
}
