"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ScrollRevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (
      !group ||
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
            group.dataset.motion = "visible";
            observer?.disconnect();
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
      );

      group.dataset.motion = "ready";
      void group.offsetHeight;
      observer.observe(group);
    } catch {
      group.removeAttribute("data-motion");
      observer?.disconnect();
    }

    return () => observer?.disconnect();
  }, []);

  return (
    <div ref={groupRef} className={className}>
      {children}
    </div>
  );
}
