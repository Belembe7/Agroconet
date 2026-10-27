import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "lucide-react";
import { ProductCard } from "@/features/catalog/product-card";
import { FavoriteToggle } from "@/features/catalog/favorite-toggle";
import { FavoriteService } from "@/services/catalog/favorite-service";
import { prisma } from "@/lib/db";
import { requireAreaSession } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Os seus favoritos",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <main className="favorites-page">
      <div className="favorites-heading">
        <p className="guide-eyebrow">A SUA LISTA</p>
        <h1>Produtos guardados.</h1>
        <p>Volte às opções que quer comparar ou comprar mais tarde.</p>
      </div>
      <Suspense
        fallback={
          <div className="catalog-product-grid">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        }
      >
        <FavoriteContents />
      </Suspense>
    </main>
  );
}

async function FavoriteContents() {
  const session = await requireAreaSession("cliente");
  const products = await new FavoriteService(prisma).list(session.user.id);
  if (!products.length)
    return (
      <div className="cart-empty">
        <Heart aria-hidden="true" className="size-12" strokeWidth={1.2} />
        <h2>A sua lista ainda está vazia.</h2>
        <p>Guarde produtos na página de detalhe para os encontrar aqui.</p>
        <Link className="creative-button" href="/produtos">
          Explorar produtos
        </Link>
      </div>
    );
  return (
    <div className="favorites-grid">
      {products.map((product) => (
        <div className="favorite-product" key={product.id}>
          <ProductCard product={product} />
          <FavoriteToggle slug={product.slug} initialSaved />
        </div>
      ))}
    </div>
  );
}
