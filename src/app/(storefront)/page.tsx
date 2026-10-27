import type { Metadata } from "next";
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
export default function HomePage({
  searchParams,
}: {
  searchParams: LandingSearchParams;
}) {
  return (
    <main className="landing-home">
      <LandingHero />
      <section id="categorias" className="guide-section">
        <div className="section-topline">
          <div>
            <p className="guide-eyebrow">O QUE O SEU CAMPO PRECISA</p>
            <h2>
              Da primeira semente
              <br />
              <span className="editorial-accent">à próxima colheita.</span>
            </h2>
          </div>
          <a href="#destaques" className="section-explore">
            Ver destaques <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
        <Suspense fallback={<Skeleton className="h-56 w-full rounded-2xl" />}>
          <LandingCategories />
        </Suspense>
      </section>
      <section id="destaques" className="guide-section highlights-section">
        <div className="section-topline">
          <div>
            <p className="guide-eyebrow">BOAS ESCOLHAS COMEÇAM AQUI</p>
            <h2>
              Em destaque.
              <br />
              <span className="editorial-accent">
                Prontos para fazer crescer.
              </span>
            </h2>
          </div>
          <p className="section-side-note">
            Produtos de vendedores aprovados, seleccionados a partir da nossa
            montra.
          </p>
        </div>
        <Suspense fallback={<CatalogLoading />}>
          <LandingHighlights searchParams={searchParams} />
        </Suspense>
      </section>
      <HowItWorks />
      <SellerInvitation />
      <section id="entregas" className="guide-section delivery-section">
        <div>
          <p className="guide-eyebrow">
            <MapPin aria-hidden="true" className="size-4" /> MAIS PERTO DE SI
          </p>
          <h2>
            Do vendedor ao seu campo.
            <br />
            <span className="editorial-accent">
              Conte com a nossa logística.
            </span>
          </h2>
          <p>
            Entregas coordenadas pela Agroconet nas zonas activas. A cobertura,
            o custo e o prazo são confirmados conforme a sua morada e os
            produtos escolhidos.
          </p>
          <a href="#contactos" className="section-explore">
            Confirmar a minha zona{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
        <Suspense
          fallback={<Skeleton className="h-[360px] w-full rounded-3xl" />}
        >
          <DeliveryCoverage />
        </Suspense>
      </section>
      <ConfidenceSection />
    </main>
  );
}
