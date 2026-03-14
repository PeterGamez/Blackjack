interface Card {
  suit: string;
  rank: string;
  value: number;
}

export const getCardImagePath = (card: Card): string => {
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

  return `/cards/${suit}_${rank}.png`;
};

export const getCardBackImage = (variant: number = 1): string => {
  return `/cards/back0${Math.max(1, Math.min(variant, 7))}.png`;
};
