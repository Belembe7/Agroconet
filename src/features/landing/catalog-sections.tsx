import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import {
  ArrowUpRight,
  Package,
  Sprout,
  ArrowRight,
  Search,
} from "lucide-react";
import {
  getLandingCategories,
  getLandingHighlights,
} from "@/features/landing/data";
import { normalizeLandingQuery } from "@/services/catalog/landing-service";
import { PriceTag } from "@/components/shared/price-tag";
import { categoryImagePosition } from "@/lib/category-image";
import { productImageUrl } from "@/lib/product-image";
import { getCatalogUnavailableDescription } from "@/features/catalog/messages";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";

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
export async function LandingCategories() {
  await connection();
  let categories;
  try {
    categories = await getLandingCategories();
  } catch {
    return (
      <ErrorState
        title="Categorias temporariamente indisponíveis"
        description={getCatalogUnavailableDescription()}
      />
    );
  }
  if (!categories.length)
    return (
      <EmptyState
        title="Novas possibilidades a caminho"
        description="Estamos a preparar as categorias para o seu campo."
      />
    );
  return (
    <div className="landing-categories">
      {categories.map((category, index) => {
        const imagePosition = categoryImagePosition(
          `${category.name} ${category.description ?? ""}`,
        );

        return (
          <Link
            className={`landing-category category-tone-${index % 3}`}
            href={`/produtos?categoria=${encodeURIComponent(category.slug)}`}
            key={category.id}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {imagePosition && (
              <span
                aria-hidden="true"
                className="landing-category-art"
                style={{ backgroundPosition: imagePosition }}
              />
            )}
            <span className="landing-category-content">
              <span className="category-top">
                <Sprout aria-hidden="true" className="size-6" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </span>
              <h3>{category.name}</h3>
              {category.description && <p>{category.description}</p>}
              <span className="category-link-label">
                Explorar <ArrowUpRight aria-hidden="true" className="size-4" />
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
}: {
  searchParams: LandingSearchParams;
}) {
  await connection();
  const query = normalizeLandingQuery(await searchParams);
  let products;
  try {
    products = await getLandingHighlights(query.q, query.category);
  } catch {
    return (
      <ErrorState
        title="Não foi possível carregar os produtos"
        description={getCatalogUnavailableDescription()}
        action={
          <Link href="/produtos" className="creative-button">
            Tentar novamente{" "}
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
            ? `Resultados para “${query.q}”`
            : query.category
              ? "Produtos da categoria seleccionada"
              : "Uma selecção dos produtos publicados mais recentemente."}
        </p>
        {(query.q || query.category) && (
          <Link href="/produtos">
            Limpar pesquisa{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
      <form
        action="/produtos"
        className="catalog-search"
        role="search"
        aria-label="Pesquisar nos destaques"
      >
        <Search aria-hidden="true" className="size-5" />
        <label htmlFor="catalog-search" className="sr-only">
          Produto ou marca
        </label>
        <input
          id="catalog-search"
          name="q"
          maxLength={100}
          defaultValue={query.q}
          placeholder="Procure por produto ou marca…"
        />
        {query.category && (
          <input type="hidden" name="categoria" value={query.category} />
        )}
        <button type="submit">
          Pesquisar <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </form>
      {!products.length ? (
        <EmptyState
          title={
            query.q || query.category
              ? "Não encontrámos produtos"
              : "Estamos a preparar a montra"
          }
          description={
            query.q || query.category
              ? "Experimente outro nome, marca ou categoria."
              : "Os produtos publicados aparecerão aqui em breve."
          }
          action={
            (query.q || query.category) && (
              <Link href="/produtos" className="creative-button">
                Ver destaques
              </Link>
            )
          }
        />
      ) : (
        <div className="landing-products">
          {products.map((product) => {
            const categoryPosition = categoryImagePosition(product.category);
            const productFallbackImage = productImageUrl(product.name);
            return (
              <Link
                prefetch={false}
                href={`/produtos/${encodeURIComponent(product.slug)}`}
                className="landing-product-link"
                key={product.id}
              >
                <article className="landing-product">
                  <div className="product-visual">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.imageAlt || product.name}
                        fill
                        sizes="(max-width: 760px) 50vw, 25vw"
                        unoptimized={/^https?:\/\//.test(product.imageUrl)}
                        className="object-cover"
                      />
                    ) : productFallbackImage ? (
                      <Image
                        src={productFallbackImage}
                        alt={product.name}
                        fill
                        sizes="(max-width: 760px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : categoryPosition ? (
                      <div
                        role="img"
                        aria-label={`${product.name}, categoria ${product.category}`}
                        className="absolute inset-0 bg-[#f6f0e5]"
                        style={{
                          backgroundImage:
                            "url('/images/agro-stock-category-sheet.png')",
                          backgroundPosition: categoryPosition,
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "300% 250%",
                        }}
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
                      {product.available ? "Em stock" : "Sem stock nesta opção"}
                    </span>
                  </div>
                  <div className="product-copy">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p className="product-option">
                      {product.label}
                      {product.brand ? ` · ${product.brand}` : ""}
                    </p>
                    <p className="product-seller">Por {product.seller}</p>
                    <div className="product-price">
                      <span>A partir de</span>
                      <PriceTag cents={product.priceCents} />
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
      <p className="catalog-footnote">
        Até 8 destaques por pesquisa. Preços e disponibilidade sujeitos a
        confirmação. Para esclarecer dúvidas, fale connosco nos contactos
        abaixo.
      </p>
    </>
  );
}
