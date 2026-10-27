import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  ShieldCheck,
  Star,
} from "lucide-react";
import { PriceTag } from "@/components/shared/price-tag";
import { FavoriteToggle } from "@/features/catalog/favorite-toggle";
import { RelatedProducts } from "@/features/catalog/related-products";
import { AddToCartForm } from "@/features/cart/add-to-cart-form";
import { getCatalogProduct } from "@/features/catalog/data";
import { CatalogLoading } from "@/features/catalog/catalog-page";
import { getAppSession } from "@/lib/session";
import { FavoriteService } from "@/services/catalog/favorite-service";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,149}$/.test(slug)) return { title: "Produto" };
  const product = await getCatalogProduct(slug);
  if (!product) return { title: "Produto não encontrado" };
  const description =
    product.description?.trim().slice(0, 160) ||
    `${product.name} de ${product.seller.businessName}, vendedor aprovado na Agroconet.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produtos/${encodeURIComponent(product.slug)}` },
    openGraph: {
      title: `${product.name} · Agroconet`,
      description,
      type: "website",
      locale: "pt_MZ",
      url: `/produtos/${encodeURIComponent(product.slug)}`,
      ...(product.images[0]?.url ? { images: [product.images[0].url] } : {}),
    },
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductPageLoading />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductPageLoading() {
  return (
    <main className="product-detail-page" role="status">
      <span className="sr-only">A carregar produto…</span>
      <Skeleton className="mb-7 h-8 w-2/3" />
      <div className="product-detail-grid">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </main>
  );
}

async function ProductContent({ params }: Props) {
  await connection();
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,149}$/.test(slug)) notFound();
  const product = await getCatalogProduct(slug);
  if (!product) notFound();
  if (product.slug !== slug)
    permanentRedirect(`/produtos/${encodeURIComponent(product.slug)}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    image: product.images.length
      ? product.images.map((image) => image.url)
      : undefined,
    category: product.category.name,
    aggregateRating:
      product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          }
        : undefined,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      name: variant.label,
      priceCurrency: "MZN",
      price: (variant.priceCents / 100).toFixed(2),
      availability:
        variant.available > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: product.seller.businessName },
      url: `${env.NEXT_PUBLIC_APP_URL}/produtos/${encodeURIComponent(product.slug)}`,
    })),
  };
  const jsonLd = JSON.stringify(schema).replace(/</g, "\\u003c");
  const minimumPrice = Math.min(
    ...product.variants.map((variant) => variant.priceCents),
  );

  return (
    <main className="product-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <nav className="product-breadcrumb" aria-label="Caminho de navegação">
        <Link prefetch={false} href="/">
          <ArrowLeft aria-hidden="true" className="size-4" /> Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          prefetch={false}
          href={`/produtos?categoria=${encodeURIComponent(product.category.slug)}`}
        >
          {product.category.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <section className="product-detail-grid">
        <div className="product-gallery" aria-label="Imagens do produto">
          {product.images[0]?.url ? (
            <div className="product-gallery-main">
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 50vw"
                unoptimized={/^https?:\/\//.test(product.images[0].url)}
              />
            </div>
          ) : (
            <div className="product-gallery-placeholder">
              <Package aria-hidden="true" className="size-24" strokeWidth={1} />
              <span>Fotografia em breve</span>
            </div>
          )}
          {product.images.length > 1 ? (
            <div className="product-gallery-thumbnails">
              {product.images.slice(1, 5).map((image, index) => (
                <div
                  className="product-gallery-thumb"
                  key={`${image.url}-${index}`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${product.name}, imagem ${index + 2}`}
                    fill
                    sizes="120px"
                    unoptimized={/^https?:\/\//.test(image.url)}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="product-detail-copy">
          <p className="catalog-product-category">{product.category.name}</p>
          <div className="product-detail-title-row">
            <h1>{product.name}</h1>
            <Suspense
              fallback={
                <span
                  className="favorite-toggle-placeholder"
                  aria-hidden="true"
                />
              }
            >
              <ProductFavorite slug={product.slug} productId={product.id} />
            </Suspense>
          </div>
          {product.brand ? (
            <p className="product-detail-brand">{product.brand}</p>
          ) : null}
          {product.ratingCount > 0 ? (
            <p className="product-detail-rating">
              <Star aria-hidden="true" className="size-4 fill-current" />
              {product.ratingAvg.toFixed(1)} · {product.ratingCount} avaliação
              {product.ratingCount === 1 ? "" : "ões"}
            </p>
          ) : (
            <p className="product-detail-rating">Ainda sem avaliações</p>
          )}
          <div className="product-detail-price">
            <span>A partir de</span>
            <PriceTag cents={minimumPrice} />
          </div>
          <p className="product-detail-seller">
            Vendido por <strong>{product.seller.businessName}</strong>
            {product.seller.ratingCount > 0
              ? ` · ${product.seller.ratingAvg.toFixed(1)} (${product.seller.ratingCount} avaliações)`
              : " · Vendedor aprovado"}
          </p>
          {product.variants.length ? (
            <AddToCartForm
              productSlug={product.slug}
              variants={product.variants.map((variant) => ({
                id: variant.id,
                label: variant.label,
                priceCents: variant.priceCents,
                available: variant.available,
                isDefault: variant.isDefault,
              }))}
            />
          ) : (
            <p className="product-unavailable">
              Este produto está temporariamente indisponível.
            </p>
          )}
          <div className="product-trust-note">
            <ShieldCheck aria-hidden="true" className="size-5" />
            <span>
              Produto de vendedor aprovado. Confirme disponibilidade e entrega
              antes de concluir a compra.
            </span>
          </div>
          {product.description ? (
            <div className="product-description">
              <h2>Sobre este produto</h2>
              <p>{product.description}</p>
            </div>
          ) : null}
          {product.variants.some((variant) => variant.available > 0) ? (
            <p className="product-stock-note">
              <CheckCircle2 aria-hidden="true" className="size-4" /> Opções
              disponíveis agora
            </p>
          ) : null}
        </div>
      </section>
      {product.reviews.length ? (
        <section className="product-reviews">
          <h2>Quem já experimentou</h2>
          <div>
            {product.reviews.map((review, index) => (
              <article key={`${review.createdAt.toISOString()}-${index}`}>
                <p>
                  <Star aria-hidden="true" className="size-4 fill-current" />{" "}
                  {review.rating} de 5
                </p>
                <p>{review.comment || "Avaliação sem comentário."}</p>
                <small>{review.user.name}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="product-related-section">
        <div className="catalog-results-heading">
          <div>
            <p className="guide-eyebrow">DA MESMA CATEGORIA</p>
            <h2>Também pode interessar.</h2>
          </div>
          <Link
            prefetch={false}
            href={`/produtos?categoria=${encodeURIComponent(product.category.slug)}`}
          >
            Ver categoria
          </Link>
        </div>
        <Suspense fallback={<CatalogLoading />}>
          <RelatedProducts
            productId={product.id}
            categoryId={product.categoryId}
          />
        </Suspense>
      </section>
    </main>
  );
}

async function ProductFavorite({
  slug,
  productId,
}: {
  slug: string;
  productId: string;
}) {
  const session = await getAppSession();
  if (!session) return <FavoriteToggle slug={slug} initialSaved={false} />;
  if (!session.actor.roles.includes("CUSTOMER")) return null;
  const saved = await new FavoriteService(prisma).isSaved(
    session.user.id,
    productId,
  );
  return <FavoriteToggle slug={slug} initialSaved={saved} />;
}
