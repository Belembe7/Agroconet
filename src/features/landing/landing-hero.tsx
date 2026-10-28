import Link from "next/link";
import { ArrowUpRight, Sprout, Leaf, Truck, ShieldCheck } from "lucide-react";
import { HeroFieldVideo } from "@/features/landing/hero-field-video";
import type { SiteLocale } from "@/lib/locale";

export function LandingHero({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  return (
    <>
      <section className="guide-hero landing-hero" aria-labelledby="home-title">
        <HeroFieldVideo />
        <div className="hero-video-overlay" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-intro-loop">
            <p className="guide-eyebrow hero-reveal hero-reveal-1">
              {english
                ? "ROOTED IN THE LAND. GROWING FOR THE FUTURE."
                : "DA TERRA. COM FUTURO."}
            </p>
            <h1 id="home-title" className="hero-title hero-title-single">
              <span className="hero-title-line hero-title-line-highlight">
                <span className="hero-highlight">
                  {english ? "Everything you need" : "Tudo o que você precisa"}
                  <svg
                    viewBox="0 0 460 20"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M4 14 Q210 -4 453 10" />
                  </svg>
                </span>
              </span>
              <span className="hero-title-line">
                <span>
                  {english
                    ? "for your farm and livestock."
                    : "para o seu campo de criação."}
                </span>
              </span>
            </h1>
            <p className="hero-description hero-reveal hero-reveal-5">
              {english
                ? "Every harvest starts with a choice. Find seeds, animal care and tools to take your farm further — and connect with sellers in one place."
                : "Cada colheita começa com uma escolha. Encontre sementes, nutrição e ferramentas para levar o seu campo mais longe — e ligue-se a vendedores, num só lugar."}
            </p>
          </div>
          <Link
            href="/produtos"
            className="section-explore hero-reveal hero-reveal-7 mt-3"
          >
            {english ? "Browse all products" : "Ver todo o catálogo"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          <div className="hero-location hero-reveal hero-reveal-8">
            <span className="location-icon">
              <Leaf aria-hidden="true" className="size-4" />
            </span>
            <div>
              <strong>
                {english
                  ? "Local roots. Bigger ambitions."
                  : "Raízes locais. Ambição maior."}
              </strong>
              <span>
                {english
                  ? "Delivery in Maputo and Matola, depending on your area."
                  : "Entregas em Maputo e Matola, conforme a zona."}
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="guide-promise-strip">
        <span>
          <Sprout aria-hidden="true" />
          {english
            ? "Solutions for every crop."
            : "Soluções para cada cultivo."}
        </span>
        <span>
          <Truck aria-hidden="true" />
          {english ? "Logistics close to you." : "Logística perto de si."}
        </span>
        <span>
          <ShieldCheck aria-hidden="true" />
          {english ? "Verified sellers." : "Vendedores aprovados."}
        </span>
        <span className="promise-signature">
          {english ? "This is how we grow." : "É assim que crescemos."}
        </span>
      </div>
    </>
  );
}
