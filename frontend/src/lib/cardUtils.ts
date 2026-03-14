import LocalStorage from "./LocalStorage";

interface Card {
  suit: string;
  rank: string;
  value: number;
}

export const getCardImagePath = (card: Card, skin: string = "Default"): string => {
  const suitMap: { [key: string]: string } = {
    "♠": "spades",
    "♣": "clubs",
    "♥": "hearts",
    "♦": "diamonds",
  };

  const rankMap: { [key: string]: string } = {
    A: "a",
    J: "j",
    Q: "q",
    K: "k",
  };

  const suit = suitMap[card.suit] || "spades";
  const rank = rankMap[card.rank] ? rankMap[card.rank] : card.rank === "10" ? "10" : `0${card.rank}`;

  return `/cards/${skin}/${suit}_${rank}.png`;
};

export const getCardBackImage = (skin: string = "Default"): string => {
  return `/cards/${skin}/backcard.png`;
};

export const getSelectedSkin = (): string => {
  if (typeof window === "undefined") return "Default";
  return LocalStorage.getItem("selectedCardSkin") || "Default";
};
