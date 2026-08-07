/** Matches the exit animations in globals.css (--motion-fast). */
export const EXIT_DURATION = 150;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** scrollIntoView ignores the reduced-motion CSS rule, so decide here. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

export function scrollToId(id: string, block: ScrollLogicalPosition = "start") {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: scrollBehavior(), block });
}
