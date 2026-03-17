export interface UserInterface {
  id: number;
  username: string;
  email: string;
  role: "user" | "vip" | "admin";
  tokens: number;
  coins: number;
  cardId: number;
  chipId: number;
  tableId: number;
  inventory: { productId: number; type: string }[];
}
