import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { ArrowUpRight, Package, Sprout, ArrowRight } from "lucide-react";
import {
  getLandingCategories,
  getLandingHighlights,
} from "@/features/landing/data";
import { normalizeLandingQuery } from "@/services/catalog/landing-service";
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
  const query = normalizeLandingQuery(await searchParams);
  let products;
  try {
    products = await getLandingHighlights(query.q, query.category);
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
                ? "A selection of the most recently published products."
                : "Uma selecção dos produtos publicados mais recentemente."}
        </p>
        {(query.q || query.category) && (
          <Link href="/produtos">
            {english ? "Clear search" : "Limpar pesquisa"}{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
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
            ? "Up to 8 highlights per search. Prices and availability are subject to confirmation. Contact us below if you have any questions."
            : "Até 8 destaques por pesquisa. Preços e disponibilidade sujeitos a confirmação. Para esclarecer dúvidas, fale connosco nos contactos abaixo."}
      </p>
    </>
  );
}
