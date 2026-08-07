"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EXIT_DURATION, prefersReducedMotion } from "./motion";

/**
 * Shared behaviour for the overlays: scroll lock, Escape to dismiss, focus
 * handling, and a `closing` flag that keeps the panel mounted long enough to
 * play its exit animation before the parent unmounts it.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestClose = useCallback(() => {
    if (timer.current) return; // already closing
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    setClosing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      onClose();
    }, EXIT_DURATION);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, requestClose]);

  return { closing, requestClose, panelRef };
}
