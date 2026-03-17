export interface UserInterface {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  tokens: number;
  coins: number;
  isVerified: boolean;
}
