import { getAvatarColorIndex } from "@utils/colorUtils";

import styles from "./ProfileAvatar.module.css";

type ProfileAvatarProps = {
  username: string;
  className?: string;
};

export default function ProfileAvatar({ username, className = "" }: ProfileAvatarProps) {
  const displayName = username ? username[0].toUpperCase() + username.slice(1) : "";
  const colorClass = displayName ? styles[`color${getAvatarColorIndex(displayName)}` as keyof typeof styles] : styles.neutral;
  const initial = displayName ? displayName[0].toUpperCase() : "?";

  return <div className={`${styles.avatar} ${colorClass} ${className}`.trim()}>{initial}</div>;
}
