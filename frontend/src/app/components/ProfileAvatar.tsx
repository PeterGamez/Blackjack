import { getAvatarColorIndex } from "../../lib/colorUtils";
import styles from "./ProfileAvatar.module.css";

type ProfileAvatarProps = {
  username: string;
  className?: string;
};

export default function ProfileAvatar({ username, className = "" }: ProfileAvatarProps) {
  const colorClass = username ? styles[`color${getAvatarColorIndex(username)}` as keyof typeof styles] : styles.neutral;
  const initial = username ? username[0].toUpperCase() : "?";

  return <div className={`${styles.avatar} ${colorClass} ${className}`.trim()}>{initial}</div>;
}
