import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import { LandingHero } from "@/features/landing/landing-hero";
import {
  LandingCategories,
  LandingHighlights,
  CatalogLoading,
  type LandingSearchParams,
} from "@/features/landing/catalog-sections";
import {
  HowItWorks,
  SellerInvitation,
  DeliveryCoverage,
  ConfidenceSection,
} from "@/features/landing/information-sections";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { getSiteLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Insumos agropecuários em Maputo e Matola",
  description:
    "Encontre sementes, fertilizantes, ferramentas e soluções agropecuárias de vendedores aprovados. Conheça a Agroconet e consulte as zonas de entrega em Maputo e Matola.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Agroconet · O seu campo. Sem limites.",
    description: siteConfig.description,
    type: "website",
    locale: "pt_MZ",
    url: "/",
    images: [
      {
        url: "/images/agro-editorial.png",
        width: 1536,
        height: 1024,
        alt: "Agroconet — soluções agropecuárias",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agroconet · O seu campo. Sem limites.",
    description: siteConfig.description,
    images: ["/images/agro-editorial.png"],
  },
};
export default function HomePage(props: { searchParams: LandingSearchParams }) {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <HomePageContent {...props} />
    </Suspense>
  );
}

async function HomePageContent({
  searchParams,
}: {
  searchParams: LandingSearchParams;
}) {
  const locale = await getSiteLocale();
  return (
    <main className="landing-home">
      <LandingHero locale={locale} />
      <section id="categorias" className="guide-section">
        <div className="section-topline">
          <div>
            <p className="guide-eyebrow">
              {locale === "en" ? "CATEGORIES" : "CATEGORIAS"}
            </p>
            <h2>
              {locale === "en"
                ? "Everything for your farm"
                : "Tudo para o seu campo"}
              <br />
              <span className="editorial-accent">
                {locale === "en" ? "and livestock." : "e criação."}
              </span>
            </h2>
          </div>
          <a href="#destaques" className="section-explore">
            {locale === "en" ? "View highlights" : "Ver destaques"}{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
        <Suspense fallback={<Skeleton className="h-56 w-full rounded-2xl" />}>
          <LandingCategories locale={locale} />
        </Suspense>
      </section>
      <section id="destaques" className="guide-section highlights-section">
        <div className="section-topline">
          <div>
            <p className="guide-eyebrow">
              {locale === "en"
                ? "GOOD CHOICES START HERE"
                : "BOAS ESCOLHAS COMEÇAM AQUI"}
            </p>
            <h2>
              {locale === "en" ? "Featured." : "Em destaque."}
              <br />
              <span className="editorial-accent">
                {locale === "en"
                  ? "Ready to help you grow."
                  : "Prontos para fazer crescer."}
              </span>
            </h2>
          </div>
          <p className="section-side-note">
            {locale === "en"
              ? "Products from approved sellers, selected from our marketplace."
              : "Produtos de vendedores aprovados, seleccionados a partir da nossa montra."}
          </p>
        </div>
        <Suspense fallback={<CatalogLoading />}>
          <LandingHighlights searchParams={searchParams} locale={locale} />
        </Suspense>
      </section>
      <HowItWorks locale={locale} />
      <SellerInvitation locale={locale} />
      <section id="entregas" className="guide-section delivery-section">
        <div>
          <p className="guide-eyebrow">
            <MapPin aria-hidden="true" className="size-4" />{" "}
            {locale === "en" ? "CLOSER TO YOU" : "MAIS PERTO DE SI"}
          </p>
          <h2>
            {locale === "en"
              ? "From the seller to your farm."
              : "Do vendedor ao seu campo."}
            <br />
            <span className="editorial-accent">
              {locale === "en"
                ? "Count on our logistics."
                : "Conte com a nossa logística."}
            </span>
          </h2>
          <p>
            {locale === "en"
              ? "Deliveries are coordinated by Agroconet in active areas. Coverage, cost and timing are confirmed based on your address and selected products."
              : "Entregas coordenadas pela Agroconet nas zonas activas. A cobertura, o custo e o prazo são confirmados conforme a sua morada e os produtos escolhidos."}
          </p>
          <Link href="/entrega" className="section-explore">
            {locale === "en" ? "Plan my delivery" : "Combinar a minha entrega"}{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <Suspense
          fallback={<Skeleton className="h-[360px] w-full rounded-3xl" />}
        >
          <DeliveryCoverage />
        </Suspense>
      </section>
      <ConfidenceSection locale={locale} />
    </main>
  );
}
