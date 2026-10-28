import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Package, Star } from "lucide-react";
import { PriceTag } from "@/components/shared/price-tag";
import { categoryImagePosition } from "@/lib/category-image";
import { productImageUrl } from "@/lib/product-image";
import type { CatalogProductCard } from "@/services/catalog/catalog-service";

export function ProductCard({ product }: { product: CatalogProductCard }) {
  const categoryPosition = categoryImagePosition(product.category);
  const productFallbackImage = productImageUrl(product.name);

  return (
    <Link
      prefetch={false}
      href={`/produtos/${encodeURIComponent(product.slug)}`}
      className="catalog-product-card"
    >
      <div className="catalog-product-image">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={/^https?:\/\//.test(product.imageUrl)}
          />
        ) : productFallbackImage ? (
          <Image
            src={productFallbackImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : categoryPosition ? (
          <div
            role="img"
            aria-label={`${product.name}, categoria ${product.category}`}
            className="absolute inset-0 bg-[#f6f0e5]"
            style={{
              backgroundImage: "url('/images/agro-stock-category-sheet.png')",
              backgroundPosition: categoryPosition,
              backgroundRepeat: "no-repeat",
              backgroundSize: "300% 200%",
            }}
          />
        ) : (
          <>
            <Package aria-hidden="true" className="size-14" strokeWidth={1.2} />
            <span>Fotografia em breve</span>
          </>
        )}
        <span className="catalog-image-category">{product.category}</span>
        <span
          className={
            product.available ? "catalog-stock" : "catalog-stock is-empty"
          }
        >
          {product.available ? "Em stock" : "Sem stock"}
        </span>
      </div>
      <div className="catalog-product-copy">
        <div className="flex items-center justify-between gap-2">
          {product.ratingCount > 0 ? (
            <span className="catalog-rating">
              <Star aria-hidden="true" className="size-3.5 fill-current" />
              {product.ratingAvg.toFixed(1)}
            </span>
          ) : null}
        </div>
        <h2>{product.name}</h2>
        <p className="catalog-product-option">
          {product.label}
          {product.brand ? ` · ${product.brand}` : ""}
        </p>
        <p className="catalog-product-seller">Por {product.seller}</p>
        <div className="catalog-product-price">
          <span>A partir de</span>
          <PriceTag cents={product.priceCents} />
          <ArrowUpRight aria-hidden="true" className="ml-auto size-4" />
        </div>
      </div>
    </Link>
  );
}
