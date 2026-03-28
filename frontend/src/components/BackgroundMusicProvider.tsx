"use client";

import { useEffect, useRef, useState } from "react";

const BG_MUSIC_SRC = "/sounds/bg-music.mp3";
const FALLBACK_VOLUME = 0.3;

function getBgMusicVolume(): number {
  if (typeof window === "undefined") {
    return FALLBACK_VOLUME;
  }

  const raw = window.localStorage.getItem("musicVolume");
  if (!raw) {
    return FALLBACK_VOLUME;
  }

  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    return FALLBACK_VOLUME;
  }

  return Math.min(100, Math.max(0, value)) / 100;
}

function isBgMusicEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const raw = window.localStorage.getItem("musicEnabled");
  if (!raw) {
    return true;
  }

  return raw === "true";
}

export default function BackgroundMusicProvider() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isBgMusicEnabled()) {
      return;
    }

    const audio = new Audio(BG_MUSIC_SRC);
    audio.loop = true;
    audio.volume = getBgMusicVolume();
    audio.preload = "auto";
    audioRef.current = audio;

    const playAudio = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().catch(() => {
          // Browser autoplay policy might block this
          // Music will play on first user interaction
        });
        setIsPlaying(true);
      }
    };

    // Try to play immediately
    playAudio();

    // Also try on first user interaction
    const handleFirstInteraction = () => {
      playAudio();
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);

    // Listen for volume changes from settings page (same tab)
    const handleVolumeChange = () => {
      if (audioRef.current) {
        audioRef.current.volume = getBgMusicVolume();
      }
    };

    // Check volume every 100ms to detect changes from settings
    const volumeCheckInterval = setInterval(handleVolumeChange, 100);

    // Listen for changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "musicVolume" && audioRef.current) {
        audioRef.current.volume = getBgMusicVolume();
      }
      if (e.key === "musicEnabled" && audioRef.current) {
        if (isBgMusicEnabled()) {
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(volumeCheckInterval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null;
}
