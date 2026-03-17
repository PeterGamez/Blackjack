import LocalStorage from "./LocalStorage";

interface Card {
  suit: string;
  rank: string;
}

export const getCardBackImage = (skin: string = "default"): string => {
  return `/cards/${skin}/backcard.png`;
};

export const getCardImage = (card: Card, skin: string = "default"): string => {
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

  const suit = suitMap[card.suit];
  const rank = rankMap[card.rank] ? rankMap[card.rank] : card.rank === "10" ? "10" : `0${card.rank}`;

  return `/cards/${skin}/${suit}_${rank}.png`;
};

export const getCardSkin = (): string => {
  return LocalStorage.getItem("cardSkin") || "default";
};

export const getChipImage = (value: number, skin: string = "default"): string => {
  const normalized = Math.max(1, Math.floor(value));
  const filename = `chips${normalized}`;
  return `/chips/${skin}/${filename}.png`;
};

export const getChipSkin = (): string => {
  return LocalStorage.getItem("chipSkin") || "default";
};

export const getTableImage = (skin: string = "default"): string => {
  return `/tables/${skin}/table.png`;
};

export const getTableSkin = (): string => {
  return LocalStorage.getItem("tableSkin") || "default";
};
