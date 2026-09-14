"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media query. Always starts `false` on the server and on the first
 * client render, then settles after mount so hydration never mismatches.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True on touch-first devices (phones, tablets) where hover is unreliable. */
export function useCoarsePointer() {
  return useMediaQuery("(pointer: coarse)");
}

/** True once the viewport is wide enough for the full desktop toolbar (lg). */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}
