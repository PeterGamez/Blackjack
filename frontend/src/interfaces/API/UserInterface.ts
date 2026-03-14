export interface UserInterface {
  id: number;
  username: string;
  email: string;
  role: string;
  tokens: number;
  coins: number;
  cardId: number | null;
  chipId: number | null;
  themeId: number | null;
  inventory: { productId: number; type: string }[];
}
