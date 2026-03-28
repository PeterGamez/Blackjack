"use client";

import LocalStorage from "@lib/LocalStorage";
import { useEffect, useRef } from "react";

const BUTTON_SOUND_SRC = "/sounds/button-click.mp3";
const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "summary",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  "input[type='checkbox']",
  "input[type='radio']",
  "input[type='range']",
  "label[for]",
].join(",");

function getEffectVolume(): number {
  const raw = LocalStorage.getItem("effectVolume");

  const value = Number.parseInt(raw, 10);

  return Math.min(100, Math.max(0, value)) / 100;
}

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

function findClickableElement(target: Element): HTMLElement | null {
  let current: Element | null = target;

  while (current) {
    if (current.matches(INTERACTIVE_SELECTOR) && !isDisabledElement(current)) {
      return current as HTMLElement;
    }

    if (current instanceof HTMLElement) {
      const cursor = window.getComputedStyle(current).cursor;
      if (cursor === "pointer" && current.getAttribute("aria-disabled") !== "true") {
        return current;
      }
    }

    current = current.parentElement;
  }

  return null;
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

      const clickable = findClickableElement(target);
      if (!clickable) {
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(BUTTON_SOUND_SRC);
        audioRef.current.preload = "auto";
      }

      const audio = audioRef.current;
      audio.volume = getEffectVolume();
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
