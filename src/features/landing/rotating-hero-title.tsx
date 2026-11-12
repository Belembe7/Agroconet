"use client";

import { useEffect, useState } from "react";
import type { SiteLocale } from "@/lib/locale";

const phrases = {
  pt: [
    ["Insumos agropecuários,", "mais perto do seu campo."],
    ["Tudo o que o seu campo", "precisa, num só lugar."],
  ],
  en: [
    ["Agricultural supplies,", "closer to your field."],
    ["Everything your farm", "needs, in one place."],
  ],
} as const;

export function RotatingHeroTitle({ locale }: { locale: SiteLocale }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const options = phrases[locale];
  const [firstLine, secondLine] = options[phraseIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % options.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [options.length]);

  return (
    <h1 id="home-title" className="agro-hero-title">
      <span key={phraseIndex} className="agro-hero-title-slide">
        {firstLine}
        <br />
        <span>{secondLine}</span>
      </span>
    </h1>
  );
}
