import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  Sprout,
  Leaf,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { HeroFieldVideo } from "@/features/landing/hero-field-video";

export function LandingHero() {
  return (
    <>
      <section className="guide-hero landing-hero" aria-labelledby="home-title">
        <HeroFieldVideo />
        <div className="hero-video-overlay" aria-hidden="true" />
        <div className="hero-copy">
          <p className="guide-eyebrow hero-reveal hero-reveal-1">
            <span className="eyebrow-line" /> DA TERRA. COM FUTURO.
          </p>
          <h1
            id="home-title"
            className="hero-title"
            aria-label="O seu campo. O seu potencial. Sem limites."
          >
            <span className="hero-title-line">
              <span>O seu campo.</span>
            </span>
            <span className="hero-title-line">
              <span>O seu potencial.</span>
            </span>
            <span className="hero-title-line hero-title-line-highlight">
              <span className="hero-highlight">
                Sem limites.
                <svg
                  viewBox="0 0 460 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M4 14 Q210 -4 453 10" />
                </svg>
              </span>
            </span>
          </h1>
          <p className="hero-description hero-reveal hero-reveal-5">
            Cada colheita começa com uma escolha. Encontre sementes, nutrição e
            ferramentas para levar o seu campo mais longe — e ligue-se a
            vendedores, num só lugar.
          </p>
          <form
            action="/produtos"
            role="search"
            aria-label="Pesquisa principal"
            className="hero-search hero-reveal hero-reveal-6"
          >
            <Search aria-hidden="true" className="size-5" />
            <label htmlFor="home-search" className="sr-only">
              O que precisa para o seu campo?
            </label>
            <input
              name="q"
              id="home-search"
              maxLength={100}
              placeholder="O que precisa para o seu campo?"
            />
            <button type="submit" aria-label="Pesquisar produtos">
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </button>
          </form>
          <Link
            href="/produtos"
            className="section-explore hero-reveal hero-reveal-7 mt-3"
          >
            Ver todo o catálogo
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          <div className="hero-location hero-reveal hero-reveal-8">
            <span className="location-icon">
              <Leaf aria-hidden="true" className="size-4" />
            </span>
            <div>
              <strong>Raízes locais. Ambição maior.</strong>
              <span>Entregas em Maputo e Matola, conforme a zona.</span>
            </div>
          </div>
        </div>
      </section>
      <div className="guide-promise-strip">
        <span>
          <Sprout aria-hidden="true" />
          Soluções para cada cultivo.
        </span>
        <span>
          <Truck aria-hidden="true" />
          Logística perto de si.
        </span>
        <span>
          <ShieldCheck aria-hidden="true" />
          Vendedores aprovados.
        </span>
        <span className="promise-signature">É assim que crescemos.</span>
      </div>
    </>
  );
}
