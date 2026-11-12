import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { LandingCategories } from "@/features/landing/catalog-sections";
import { getSiteLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Explore categorias de insumos agropecuários na Agroconet.",
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <CategoriesPageContent />
    </Suspense>
  );
}

async function CategoriesPageContent() {
  const locale = await getSiteLocale();
  const english = locale === "en";
  return (
    <main className="farm-listing-page farm-categories-page">
      <header className="farm-listing-heading">
        <p className="farm-eyebrow">
          {english ? "AGROCONET CATALOGUE" : "CATÁLOGO AGROCONET"}
        </p>
        <h1>
          {english
            ? "Browse agricultural categories"
            : "Explore categorias agropecuárias"}
        </h1>
        <p>
          {english
            ? "Browse active categories and open the products available in each one."
            : "Consulte categorias activas e abra os produtos disponíveis em cada uma."}
        </p>
        <Link className="farm-inline-link" href="/produtos">
          {english ? "View all products" : "Ver todos os produtos"}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </header>
      <section
        className="farm-listing-content"
        aria-label={english ? "Product categories" : "Categorias de produtos"}
      >
        <Suspense
          fallback={
            <div className="farm-category-loading">
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <LandingCategories locale={locale} />
        </Suspense>
      </section>
    </main>
  );
}
