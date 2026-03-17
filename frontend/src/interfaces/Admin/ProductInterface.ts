export interface ProductInterface {
  id: number;
  name: string;
  description: string;
  image: string;
  path: string;
  tokens: number;
  coins: number;
  type: "card" | "chip" | "table";
  isRecommend: boolean;
  isActive: boolean;
  updatedAt: string;
}
