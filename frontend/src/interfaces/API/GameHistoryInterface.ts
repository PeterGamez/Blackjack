export interface GameHistoryInterface {
  role: "player" | "dealer";
  result: "win" | "lose" | "draw" | "blackjack";
  score: number;
  opponentScore: number;
  bet: number;
  mode: number;
  reward: number;
  createdAt: string;
}
