"use client";

import { useEffect, useRef } from "react";

export function HeroFieldVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let isVisible = false;

    const syncPlayback = () => {
      if (!isVisible || motionPreference.matches) {
        video.pause();
        return;
      }

      void video.play().catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.01 },
    );

    observer.observe(video);
    motionPreference.addEventListener("change", syncPlayback);

    return () => {
      observer.disconnect();
      motionPreference.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      className="landing-hero-video"
      loop
      muted
      playsInline
      preload="metadata"
      poster="/images/hero-lettuce-poster.jpg"
      tabIndex={-1}
    >
      <source src="/videos/hero-lettuce-field.mp4" type="video/mp4" />
    </video>
  );
}
