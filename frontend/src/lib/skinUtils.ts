import LocalStorage from "./LocalStorage";

interface Card {
  suit: string;
  rank: string;
  value: number;
}

export const getCardImagePath = (card: Card, skin: string = "default"): string => {
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

export const getCardBackImage = (skin: string = "default"): string => {
  return `/cards/${skin}/backcard.png`;
};

export const getCardSkin = (): string => {
  if (typeof window === "undefined") return "default";
  return LocalStorage.getItem("cardSkin") || "default";
};

export const getChipSkin = (): string => {
  if (typeof window === "undefined") return "default";
  return LocalStorage.getItem("chipSkin") || "default";
};

export const getTableImage = (skin: string = "default"): string => {
  return `/tables/${skin}/table.png`;
};

export const getTableSkin = (): string => {
  if (typeof window === "undefined") return "default";
  return LocalStorage.getItem("tableSkin") || "default";
};

export const getChipImagePath = (value: number, skin: string = "default"): string => {
  const normalized = Math.max(1, Math.floor(value));
  const filename = normalized === 1000 ? "chips1000" : `chip${normalized}`;
  return `/chips/${skin}/${filename}.png`;
};
