import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Leaf, Search } from "lucide-react";
import { FloatingLoginCard } from "@/features/landing/floating-login-card";
import { RotatingHeroTitle } from "@/features/landing/rotating-hero-title";
import type { SiteLocale } from "@/lib/locale";

export function LandingHero({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";

  return (
    <section className="agro-hero" aria-labelledby="home-title">
      <Image
        src="/images/agro-editorial.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="agro-hero-image"
      />
      <div className="agro-hero-shade" aria-hidden="true" />
      <div className="agro-hero-layout">
        <div className="agro-hero-content">
          <p className="agro-hero-eyebrow">
            <Leaf aria-hidden="true" className="size-4" />
            {english
              ? "AGRICULTURAL MARKETPLACE · MOZAMBIQUE"
              : "MARKETPLACE AGROPECUÁRIO · MOÇAMBIQUE"}
          </p>
          <RotatingHeroTitle locale={locale} />
          <p className="agro-hero-description">
            {english
              ? "Find agricultural supplies, compare available products and follow your order through local delivery."
              : "Encontre insumos agropecuários, compare produtos disponíveis e acompanhe o seu pedido até à entrega local."}
          </p>
          <div className="agro-hero-actions">
            <Link href="/registar" className="agro-button agro-button-lime">
              {english ? "Create an account" : "Criar conta"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/produtos" className="agro-button agro-button-ghost">
              {english ? "Browse products" : "Explorar produtos"}
            </Link>
          </div>
          <p className="agro-hero-location">
            <span className="farm-location-dot" aria-hidden="true" />
            {english
              ? "Delivery coordinated in Maputo and Matola"
              : "Entregas coordenadas em Maputo e Matola"}
          </p>
        </div>
        <FloatingLoginCard locale={locale} />
      </div>
    </section>
  );
}

export function LandingSearch({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  return (
    <section
      className="home-search-section"
      aria-label={english ? "Search marketplace" : "Pesquisar no marketplace"}
    >
      <div className="home-search-inner">
        <div className="home-search-copy">
          <p>{english ? "START HERE" : "COMECE POR AQUI"}</p>
          <h2>
            {english
              ? "What do you need for your farm?"
              : "O que precisa para o seu campo?"}
          </h2>
        </div>
        <form action="/produtos" className="home-search-form" role="search">
          <Search aria-hidden="true" className="size-5" />
          <label htmlFor="home-search" className="sr-only">
            {english
              ? "Search products, brands and categories"
              : "Pesquisar produtos, marcas e categorias"}
          </label>
          <input
            id="home-search"
            name="q"
            maxLength={100}
            placeholder={
              english
                ? "Search products, brands or categories"
                : "Pesquisar produtos, marcas ou categorias"
            }
          />
          <button type="submit">
            {english ? "Search" : "Pesquisar"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
