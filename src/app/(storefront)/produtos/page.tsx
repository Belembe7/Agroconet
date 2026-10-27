import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import {
  CatalogFilters,
  CatalogLoading,
  CatalogResults,
} from "@/features/catalog/catalog-page";
import type { CatalogQueryInput } from "@/services/catalog/catalog-service";

export const metadata: Metadata = {
  title: "Catálogo de produtos agropecuários",
  description:
    "Explore sementes, fertilizantes, ferramentas e outros produtos de vendedores aprovados pela Agroconet.",
  alternates: { canonical: "/produtos" },
  openGraph: {
    title: "Catálogo Agroconet",
    description: "Produtos para fazer crescer, de vendedores aprovados.",
    type: "website",
    locale: "pt_MZ",
    url: "/produtos",
  },
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogQueryInput>;
}) {
  return (
    <main className="catalog-page">
      <section className="catalog-page-intro">
        <p className="guide-eyebrow">SELECÇÃO AGROCONET</p>
        <h1>Encontre o que faz o seu campo crescer.</h1>
        <p>
          Pesquise produtos e compare opções de vendedores aprovados em Maputo e
          Matola.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#catalogo-filtros" className="section-explore">
            Pesquisar e filtrar
            <ArrowDown aria-hidden="true" className="size-4" />
          </a>
          <Link href="/#categorias" className="section-explore">
            Explorar categorias
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
      <Suspense
        fallback={
          <div
            className="catalog-filters-placeholder flex flex-col justify-center gap-2 px-5"
            role="status"
            aria-busy="true"
          >
            <span className="sr-only">A carregar opções de pesquisa…</span>
            <div className="h-3 w-28 animate-pulse rounded bg-[#dce3d7]" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-[#e7ebe2]" />
          </div>
        }
      >
        <CatalogFilters params={searchParams} />
      </Suspense>
      <Suspense fallback={<CatalogLoading />}>
        <CatalogResults params={searchParams} />
      </Suspense>
    </main>
  );
}
