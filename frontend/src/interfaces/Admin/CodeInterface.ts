export interface CodeInterface {
  id: number;
  code: string;
  amount: number;
  type: "coins" | "tokens";
  maxUses: number;
  isActive: boolean;
  expiredDate: string;
}
