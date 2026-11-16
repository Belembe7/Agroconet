import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Package,
  Sprout,
  ArrowRight,
} from "lucide-react";
import {
  getLandingCategories,
  getLandingHighlights,
} from "@/features/landing/data";
import {
  normalizeLandingPage,
  normalizeLandingQuery,
} from "@/services/catalog/landing-service";
import { PriceTag } from "@/components/shared/price-tag";
import { ProductFallbackPhoto } from "@/components/shared/product-fallback-photo";
import { productImageAsset } from "@/lib/product-image";
import { getCatalogUnavailableDescription } from "@/features/catalog/messages";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { localizeCategory, type SiteLocale } from "@/lib/locale";

export type LandingSearchParams = Promise<{
  q?: string | string[];
  categoria?: string | string[];
  pagina?: string | string[];
}>;
export function CatalogLoading() {
  return (
    <div role="status" className="grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
      <span className="sr-only">A carregar produtos…</span>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-72 w-full rounded-2xl" />
      ))}
    </div>
  );
}
export async function LandingCategories({ locale }: { locale: SiteLocale }) {
  await connection();
  let categories;
  try {
    categories = await getLandingCategories();
  } catch {
    return (
      <ErrorState
        title={
          locale === "en"
            ? "Categories are temporarily unavailable"
            : "Categorias temporariamente indisponíveis"
        }
        description={
          locale === "en"
            ? "Please try again in a moment."
            : getCatalogUnavailableDescription()
        }
      />
    );
  }
  if (!categories.length)
    return (
      <EmptyState
        title={
          locale === "en"
            ? "New possibilities are on the way"
            : "Novas possibilidades a caminho"
        }
        description={
          locale === "en"
            ? "We are preparing categories for your farm."
            : "Estamos a preparar as categorias para o seu campo."
        }
      />
    );
  return (
    <div className="landing-categories">
      {categories.map((category, index) => {
        return (
          <Link
            className={`landing-category category-tone-${index % 3}`}
            href={`/produtos?categoria=${encodeURIComponent(category.slug)}`}
            key={category.id}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span aria-hidden="true" className="landing-category-art">
              <Sprout className="size-12" strokeWidth={1.2} />
            </span>
            <span className="landing-category-content">
              <span className="category-top">
                <Sprout aria-hidden="true" className="size-6" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </span>
              <h3>{localizeCategory(category.name, locale)}</h3>
              {category.description && <p>{category.description}</p>}
              <span className="category-link-label">
                {locale === "en" ? "Explore" : "Explorar"}{" "}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
export async function LandingHighlights({
  searchParams,
  locale,
}: {
  searchParams: LandingSearchParams;
  locale: SiteLocale;
}) {
  const english = locale === "en";
  await connection();
  const params = await searchParams;
  const query = normalizeLandingQuery(params);
  const page = normalizeLandingPage(params.pagina);
  let result;
  try {
    result = await getLandingHighlights(query.q, query.category, page);
  } catch {
    return (
      <ErrorState
        title={
          english
            ? "Could not load products"
            : "Não foi possível carregar os produtos"
        }
        description={
          english
            ? "Please try again in a moment."
            : getCatalogUnavailableDescription()
        }
        action={
          <Link href="/produtos" className="creative-button">
            {english ? "Try again" : "Tentar novamente"}{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      />
    );
  }
  const products = result.products;
  const pageHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query.q) search.set("q", query.q);
    if (query.category) search.set("categoria", query.category);
    if (nextPage > 1) search.set("pagina", String(nextPage));
    const queryString = search.toString();
    return `/${queryString ? `?${queryString}` : ""}#destaques`;
  };
  return (
    <>
      <div className="catalog-results-bar">
        <p>
          {query.q
            ? english
              ? `Results for “${query.q}”`
              : `Resultados para “${query.q}”`
            : query.category
              ? english
                ? "Products in the selected category"
                : "Produtos da categoria seleccionada"
              : english
                ? "Featured and recently published products."
                : "Produtos em destaque e publicados recentemente."}
        </p>
        {(query.q || query.category) && (
          <Link href="/produtos">
            {english ? "Clear search" : "Limpar pesquisa"}{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
      {result.total > result.pageSize ? (
        <nav
          aria-label={english ? "Featured products pages" : "Mais produtos"}
          className="flex flex-wrap items-center justify-between gap-3 py-4"
        >
          <p className="text-muted-foreground text-sm">
            {english ? "Products" : "Produtos"}{" "}
            {(result.page - 1) * result.pageSize + 1}–
            {Math.min(result.page * result.pageSize, result.total)}{" "}
            {english ? "of" : "de"} {result.total}
          </p>
          <div className="flex items-center gap-2">
            {result.page > 1 ? (
              <Link
                href={pageHref(result.page - 1)}
                aria-label={
                  english ? "Previous products" : "Produtos anteriores"
                }
                className="border-input hover:bg-accent inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                {english ? "Previous" : "Anterior"}
              </Link>
            ) : null}
            {result.page < result.totalPages ? (
              <Link
                href={pageHref(result.page + 1)}
                aria-label={english ? "See more products" : "Ver mais produtos"}
                className="border-input hover:bg-accent inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium"
              >
                {english ? "More products" : "Mais produtos"}
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
      {!products.length ? (
        <EmptyState
          title={
            query.q || query.category
              ? english
                ? "No products found"
                : "Não encontrámos produtos"
              : english
                ? "We are preparing the marketplace"
                : "Estamos a preparar a montra"
          }
          description={
            query.q || query.category
              ? english
                ? "Try another name, brand or category."
                : "Experimente outro nome, marca ou categoria."
              : english
                ? "Published products will appear here soon."
                : "Os produtos publicados aparecerão aqui em breve."
          }
          action={
            (query.q || query.category) && (
              <Link href="/produtos" className="creative-button">
                {english ? "View highlights" : "Ver destaques"}
              </Link>
            )
          }
        />
      ) : (
        <div className="landing-products">
          {products.map((product) => {
            const productFallbackImage = productImageAsset(product.name);
            const isSeedPackagePhoto =
              productFallbackImage?.src.endsWith(".png") ?? false;
            const usesPackagingPhoto = product.estimated || isSeedPackagePhoto;
            const imageUrl = product.imageUrl ?? productFallbackImage?.src;
            return (
              <Link
                prefetch={false}
                href={`/produtos/${encodeURIComponent(product.slug)}`}
                className="landing-product-link"
                key={product.id}
              >
                <article className="landing-product">
                  <div
                    className={
                      usesPackagingPhoto
                        ? "product-visual product-visual-packaging"
                        : "product-visual"
                    }
                  >
                    {product.isFeatured ? (
                      <span className="absolute top-3 left-3 z-10 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
                        {english ? "Featured" : "Destaque"}
                      </span>
                    ) : null}
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.imageAlt || product.name}
                        fill
                        sizes="(max-width: 760px) 50vw, 25vw"
                        unoptimized={
                          /^https?:\/\//.test(imageUrl) ||
                          imageUrl.startsWith("/api/product-images/")
                        }
                        className={
                          usesPackagingPhoto
                            ? "product-packaging-photo object-contain"
                            : "object-cover"
                        }
                      />
                    ) : productFallbackImage ? (
                      <ProductFallbackPhoto
                        asset={productFallbackImage}
                        name={product.name}
                        sizes="(max-width: 760px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <>
                        <Package
                          aria-hidden="true"
                          className="size-16"
                          strokeWidth={1}
                        />
                        <span>Fotografia em breve</span>
                      </>
                    )}
                    <span
                      className={
                        product.available
                          ? "stock-label"
                          : "stock-label stock-empty"
                      }
                    >
                      {product.available
                        ? english
                          ? "In stock"
                          : "Em stock"
                        : english
                          ? "Out of stock"
                          : "Sem stock nesta opção"}
                    </span>
                  </div>
                  <div className="product-copy">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p className="product-option">
                      {product.label}
                      {product.brand ? ` · ${product.brand}` : ""}
                    </p>
                    <p className="product-seller">
                      {product.estimated
                        ? english
                          ? "Seller to be confirmed"
                          : "Fornecedor por confirmar"
                        : `${english ? "By" : "Por"} ${product.seller}`}
                    </p>
                    <div className="product-price">
                      <span>{english ? "From" : "A partir de"}</span>
                      <div className="flex flex-col items-start leading-tight">
                        {product.compareAtPriceCents ? (
                          <PriceTag
                            cents={product.compareAtPriceCents}
                            className="text-muted-foreground text-[11px] font-normal line-through"
                          />
                        ) : null}
                        <PriceTag
                          cents={product.priceCents}
                          className="text-[17px]"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
      <p className="catalog-footnote">
        {products.some((product) => product.estimated)
          ? english
            ? "These seed highlights use estimated prices, package sizes and stock. Sellers are still to be confirmed; contact us before ordering."
            : "Estes destaques de sementes têm preços, embalagens e stock estimados. Os fornecedores estão por confirmar; contacte-nos antes de encomendar."
          : english
            ? "Up to 8 products per page. Use the arrows to explore the rest of the catalogue. Prices and availability are subject to confirmation."
            : "Até 8 produtos por página. Use as setas para explorar o restante catálogo. Preços e disponibilidade sujeitos a confirmação."}
      </p>
    </>
  );
}
