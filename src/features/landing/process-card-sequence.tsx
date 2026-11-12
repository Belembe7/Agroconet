"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ProcessCardSequence({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (
      !list ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    let observer: IntersectionObserver | undefined;
    try {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            list.dataset.motion = "visible";
            observer?.disconnect();
          }
        },
        { threshold: 0.18 },
      );

      list.dataset.motion = "ready";
      void list.offsetHeight;
      observer.observe(list);
    } catch {
      list.removeAttribute("data-motion");
      observer?.disconnect();
      return;
    }

    return () => observer?.disconnect();
  }, []);

  return (
    <ol ref={listRef} className="farm-process-grid">
      {children}
    </ol>
  );
}
