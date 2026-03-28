const AVATAR_COLORS = ["#e05c5c", "#e0885c", "#d4a632", "#6db86d", "#5cb8b8", "#5c8ae0", "#8e5ce0", "#c05ce0", "#e05c9a", "#4ca8c8"];

export function getAvatarColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[getAvatarColorIndex(name)];
}
