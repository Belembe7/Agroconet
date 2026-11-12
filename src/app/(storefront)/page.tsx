import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { LandingHero, LandingSearch } from "@/features/landing/landing-hero";
import {
  LandingCategories,
  LandingHighlights,
  CatalogLoading,
  type LandingSearchParams,
} from "@/features/landing/catalog-sections";
import { DeliveryCoverage } from "@/features/landing/information-sections";
import { LandingBenefits } from "@/features/landing/home-sections";
import {
  HomeProcess,
  MarketplaceRoles,
} from "@/features/landing/farmbity-public-pages";
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
  const english = locale === "en";

  return (
    <main className="landing-home agro-home farm-home-page">
      <LandingHero locale={locale} />
      <LandingSearch locale={locale} />
      <LandingBenefits locale={locale} />

      <section id="categorias" className="guide-section agro-category-section">
        <div className="section-topline agro-section-topline">
          <div>
            <p className="agro-eyebrow">
              {english ? "EXPLORE THE MARKETPLACE" : "EXPLORE O MARKETPLACE"}
            </p>
            <h2>
              {english ? "The right supplies" : "Os produtos certos"}
              <br />
              <span className="editorial-accent">
                {english ? "for your field." : "para o seu campo."}
              </span>
            </h2>
          </div>
          <Link href="/produtos" className="section-explore agro-section-link">
            {english ? "View all products" : "Ver todos os produtos"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
          <LandingCategories locale={locale} />
        </Suspense>
      </section>

      <section
        id="destaques"
        className="guide-section highlights-section agro-highlights-section"
      >
        <div className="section-topline agro-section-topline">
          <div>
            <p className="agro-eyebrow">
              {english ? "AVAILABLE IN THE CATALOGUE" : "DISPONÍVEIS NA MONTRA"}
            </p>
            <h2>
              {english ? "Featured options." : "Opções em destaque."}
              <br />
              <span className="editorial-accent">
                {english ? "Ready to explore." : "Prontas a explorar."}
              </span>
            </h2>
          </div>
          <p className="section-side-note">
            {english
              ? "A selection of products published by approved sellers."
              : "Uma selecção de produtos publicados por vendedores aprovados."}
          </p>
        </div>
        <Suspense fallback={<CatalogLoading />}>
          <LandingHighlights searchParams={searchParams} locale={locale} />
        </Suspense>
      </section>

      <HomeProcess locale={locale} />
      <MarketplaceRoles locale={locale} />

      <section
        id="entregas"
        className="guide-section delivery-section agro-delivery-section"
      >
        <div className="agro-delivery-copy">
          <p className="agro-eyebrow">
            <MapPin aria-hidden="true" className="size-4" />
            {english ? "LOCAL DELIVERY" : "ENTREGA LOCAL"}
          </p>
          <h2>
            {english ? "From the seller to" : "Do vendedor até"}
            <br />
            <span className="editorial-accent">
              {english ? "your door." : "à sua porta."}
            </span>
          </h2>
          <p>
            {english
              ? "Delivery is coordinated in active areas. Coverage, cost and timing are confirmed based on your address and selected products."
              : "As entregas são coordenadas nas zonas activas. A cobertura, o custo e o prazo são confirmados conforme a sua morada e os produtos escolhidos."}
          </p>
          <Link href="/entrega" className="agro-text-link">
            {english ? "Check delivery areas" : "Consultar zonas de entrega"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <Suspense
          fallback={<Skeleton className="h-[360px] w-full rounded-3xl" />}
        >
          <DeliveryCoverage />
        </Suspense>
      </section>
    </main>
  );
}
