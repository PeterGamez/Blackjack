interface Card {
  suit: string;
  rank: string;
  value: number;
}

export const getCardImagePath = (card: Card, skin: string = "default"): string => {
  // Map suit symbols to folder names
  const suitMap: { [key: string]: string } = {
    "♠": "spades",
    "♣": "clubs",
    "♥": "hearts",
    "♦": "diamonds",
  };

  // Map rank to image name
  const rankMap: { [key: string]: string } = {
    A: "ace",
    J: "jack",
    Q: "queen",
    K: "king",
  };

  const suit = suitMap[card.suit] || "spades";
  const rank = rankMap[card.rank] ? rankMap[card.rank] : card.rank === "10" ? "10" : `0${card.rank}`;

  return `/cards/${skin}/${suit}_${rank}.png`;
};

export const getCardBackImage = (variant: number = 1, skin: string = "default"): string => {
  return `/cards/${skin}/back0${Math.max(1, Math.min(variant, 8))}.png`;
};

export const getSelectedSkin = (): string => {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem("selectedCardSkin") ?? "default";
};
