import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { getCatalogCategories, getCatalogPage } from "@/features/catalog/data";
import { getCatalogUnavailableDescription } from "@/features/catalog/messages";
import { ProductCard } from "@/features/catalog/product-card";
import {
  normalizeCatalogQuery,
  type CatalogQueryInput,
} from "@/services/catalog/catalog-service";

export function CatalogLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid grid-cols-2 gap-4 py-6 lg:grid-cols-4"
    >
      <span className="sr-only">A carregar catálogo…</span>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-80 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export async function CatalogFilters({
  params,
}: {
  params: Promise<CatalogQueryInput>;
}) {
  await connection();
  const query = normalizeCatalogQuery(await params);
  let categories: Awaited<ReturnType<typeof getCatalogCategories>> = [];
  try {
    categories = await getCatalogCategories();
  } catch {
    categories = [];
  }
  return (
    <form
      action="/produtos"
      id="catalogo-filtros"
      className="catalog-filters"
      role="search"
      aria-label="Filtrar produtos"
    >
      <div className="catalog-filter-search">
        <Search aria-hidden="true" className="size-5" />
        <label className="sr-only" htmlFor="catalog-q">
          Pesquisar produtos
        </label>
        <input
          id="catalog-q"
          name="q"
          maxLength={100}
          defaultValue={query.q}
          placeholder="Produto, marca ou solução…"
        />
      </div>
      <label className="catalog-filter-field">
        <span>Categoria</span>
        <select name="categoria" defaultValue={query.category}>
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="catalog-filter-field">
        <span>Ordenar por</span>
        <select name="ordenar" defaultValue={query.sort}>
          <option value="relevance">Relevância</option>
          <option value="recent">Mais recentes</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="name">Nome A–Z</option>
        </select>
      </label>
      <label className="catalog-filter-field">
        <span>Preço mínimo (MT)</span>
        <input
          name="minimo"
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          defaultValue={
            query.minPriceCents === null
              ? ""
              : (query.minPriceCents / 100).toFixed(2)
          }
        />
      </label>
      <label className="catalog-filter-field">
        <span>Preço máximo (MT)</span>
        <input
          name="maximo"
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          defaultValue={
            query.maxPriceCents === null
              ? ""
              : (query.maxPriceCents / 100).toFixed(2)
          }
        />
      </label>
      <label className="catalog-filter-stock">
        <input
          type="checkbox"
          name="stock"
          value="1"
          defaultChecked={query.inStock}
        />
        <span>Mostrar só o que está em stock</span>
      </label>
      <button className="catalog-filter-button" type="submit">
        <SlidersHorizontal aria-hidden="true" className="size-4" /> Aplicar
        filtros
      </button>
    </form>
  );
}

function catalogHref(query: CatalogQueryInput, page: number) {
  const normalized = normalizeCatalogQuery(query);
  const params = new URLSearchParams();
  if (normalized.q) params.set("q", normalized.q);
  if (normalized.category) params.set("categoria", normalized.category);
  if (normalized.sort) params.set("ordenar", normalized.sort);
  if (normalized.minPriceCents !== null)
    params.set("minimo", (normalized.minPriceCents / 100).toFixed(2));
  if (normalized.maxPriceCents !== null)
    params.set("maximo", (normalized.maxPriceCents / 100).toFixed(2));
  if (normalized.inStock) params.set("stock", "1");
  if (page > 1) params.set("pagina", String(page));
  return `/produtos?${params.toString()}#resultados`;
}

export async function CatalogResults({
  params,
}: {
  params: Promise<CatalogQueryInput>;
}) {
  await connection();
  const raw = await params;
  const query = normalizeCatalogQuery(raw);
  let result;
  try {
    result = await getCatalogPage(query);
  } catch {
    return (
      <ErrorState
        title="Não foi possível carregar o catálogo"
        description={getCatalogUnavailableDescription()}
      />
    );
  }
  const shownStart =
    result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const shownEnd = Math.min(result.page * result.pageSize, result.total);
  const activeFilters = [
    query.q ? `Pesquisa: “${query.q}”` : null,
    query.category
      ? `Categoria: ${query.category
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}`
      : null,
    query.minPriceCents !== null
      ? `Mínimo: ${formatPrice(query.minPriceCents)}`
      : null,
    query.maxPriceCents !== null
      ? `Máximo: ${formatPrice(query.maxPriceCents)}`
      : null,
    query.inStock ? "Só produtos em stock" : null,
  ].filter((filter): filter is string => filter !== null);
  return (
    <div id="resultados" className="catalog-results">
      <div className="catalog-results-heading">
        <div>
          <p className="guide-eyebrow">A MONTRA AGROCONET</p>
          <h2>
            {query.q
              ? `Resultados para “${query.q}”`
              : "Produtos para fazer crescer."}
          </h2>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true">
          {shownStart}–{shownEnd} de {result.total} produtos
        </p>
      </div>
      {activeFilters.length ? (
        <div
          className="mb-6 flex flex-wrap items-center gap-2 text-xs"
          aria-label="Filtros aplicados"
        >
          <span className="font-semibold text-[#405747]">A mostrar:</span>
          {activeFilters.map((filter) => (
            <span
              key={filter}
              className="rounded-full border border-[#dbe2d7] bg-white px-3 py-1.5 text-[#405747]"
            >
              {filter}
            </span>
          ))}
          <Link
            className="min-h-9 px-2 py-2 font-semibold text-[#185d3e] underline underline-offset-4"
            href="/produtos#resultados"
          >
            Limpar filtros
          </Link>
        </div>
      ) : null}
      {!result.products.length ? (
        <EmptyState
          title={
            activeFilters.length
              ? "Não encontrámos produtos com estes critérios"
              : "Ainda não há produtos no catálogo"
          }
          description={
            activeFilters.length
              ? "Experimente outra pesquisa ou remova alguns filtros para ver mais opções."
              : "Os produtos publicados por vendedores aprovados aparecerão aqui. Volte em breve para descobrir novidades."
          }
          action={
            activeFilters.length ? (
              <Link className="creative-button" href="/produtos#resultados">
                Limpar filtros
              </Link>
            ) : (
              <Link className="creative-button" href="/#categorias">
                Explorar categorias
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="catalog-product-grid">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {result.totalPages > 1 ? (
            <nav
              className="catalog-pagination"
              aria-label="Paginação do catálogo"
            >
              {result.page > 1 ? (
                <Link href={catalogHref(raw, result.page - 1)}>
                  <ArrowLeft aria-hidden="true" className="size-4" /> Anterior
                </Link>
              ) : (
                <span aria-disabled="true">
                  <ArrowLeft aria-hidden="true" className="size-4" /> Anterior
                </span>
              )}
              <p>
                Página {result.page} de {result.totalPages}
              </p>
              {result.page < result.totalPages ? (
                <Link href={catalogHref(raw, result.page + 1)}>
                  Seguinte <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              ) : (
                <span aria-disabled="true">
                  Seguinte <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
