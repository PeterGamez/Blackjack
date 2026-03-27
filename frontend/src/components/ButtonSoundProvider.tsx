"use client";

import { useEffect, useRef } from "react";

const BUTTON_SOUND_SRC = "/sounds/button-click.mp3";
const BUTTON_SELECTOR = [
  "button",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
].join(",");

function isDisabledElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return true;
  }

  if (element.getAttribute("aria-disabled") === "true") {
    return true;
  }

  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
    return element.disabled;
  }

  return false;
}

export default function ButtonSoundProvider() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest(BUTTON_SELECTOR);
      if (!button || isDisabledElement(button)) {
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(BUTTON_SOUND_SRC);
        audioRef.current.preload = "auto";
        audioRef.current.volume = 0.5;
      }

      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch(() => {
        // Ignore browser/media playback errors.
      });
    };

    document.addEventListener("click", onDocumentClick, true);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return null;
}
