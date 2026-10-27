import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Package } from "lucide-react";
import { PriceTag } from "@/components/shared/price-tag";
import { Button } from "@/components/ui/button";
import { CartItemControls } from "@/features/cart/cart-item-controls";
import { getCurrentCartSnapshot } from "@/features/cart/server";
import { Skeleton } from "@/components/ui/skeleton";
import { getAppSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "O seu carrinho",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <main className="cart-page">
      <div className="cart-page-heading">
        <p className="guide-eyebrow">A SUA ESCOLHA</p>
        <h1>O seu carrinho.</h1>
        <p>Reveja as opções e quantidades antes de avançar.</p>
      </div>
      <Suspense
        fallback={
          <div className="cart-loading" role="status">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <span className="sr-only">A carregar carrinho…</span>
          </div>
        }
      >
        <CartContents />
      </Suspense>
    </main>
  );
}

async function CartContents() {
  let cart;
  try {
    cart = await getCurrentCartSnapshot();
  } catch {
    return (
      <p role="alert" className="cart-error-panel">
        Não foi possível carregar o carrinho. Tente novamente.
      </p>
    );
  }
  if (!cart.itemCount)
    return (
      <div className="cart-empty">
        <Package aria-hidden="true" className="size-12" strokeWidth={1.2} />
        <h2>O carrinho ainda está vazio.</h2>
        <p>
          Explore a montra e guarde aqui os produtos que precisa para o seu
          campo.
        </p>
        <Button render={<Link href="/produtos" />}>
          Explorar produtos <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    );
  const session = await getAppSession();
  const canCheckout = Boolean(session?.actor.roles.includes("CUSTOMER"));

  return (
    <div className="cart-layout">
      <div className="cart-lines">
        {cart.groups.map((group) => (
          <section className="cart-seller-group" key={group.sellerId}>
            <header>
              <span>Vendido por</span>
              <strong>{group.sellerName}</strong>
            </header>
            {group.items.map((item) => (
              <article className="cart-line" key={item.id}>
                <Link
                  prefetch={false}
                  href={`/produtos/${encodeURIComponent(item.productSlug)}`}
                  className="cart-line-image"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt || item.productName}
                      fill
                      sizes="110px"
                      unoptimized={/^https?:\/\//.test(item.imageUrl)}
                    />
                  ) : (
                    <Package
                      aria-hidden="true"
                      className="size-9"
                      strokeWidth={1.2}
                    />
                  )}
                </Link>
                <div className="cart-line-copy">
                  <Link
                    prefetch={false}
                    href={`/produtos/${encodeURIComponent(item.productSlug)}`}
                    className="cart-line-name"
                  >
                    {item.productName}
                  </Link>
                  <p>
                    {item.variantLabel}
                    {item.productBrand ? ` · ${item.productBrand}` : ""}
                  </p>
                  <PriceTag cents={item.priceCents} />
                  {item.available < 1 ? (
                    <p className="cart-stock-error">
                      Sem stock disponível. Remova este artigo para continuar.
                    </p>
                  ) : item.quantity > item.available ? (
                    <p className="cart-stock-error">
                      Só há {item.available} unidades disponíveis.
                    </p>
                  ) : null}
                  <CartItemControls
                    itemId={item.id}
                    quantity={item.quantity}
                    available={item.available}
                  />
                </div>
                <strong className="cart-line-total">
                  <PriceTag cents={item.lineTotalCents} />
                </strong>
              </article>
            ))}
            <div className="cart-seller-subtotal">
              <span>Subtotal deste vendedor</span>
              <PriceTag cents={group.subtotalCents} />
            </div>
          </section>
        ))}
      </div>
      <aside className="cart-summary">
        <p className="guide-eyebrow">RESUMO</p>
        <h2>Subtotal</h2>
        <PriceTag cents={cart.totalCents} />
        <p>Entrega e disponibilidade serão confirmadas na próxima etapa.</p>
        <Button
          render={
            <Link
              href={canCheckout ? "/checkout" : "/entrar?next=%2Fcheckout"}
            />
          }
          className="w-full"
        >
          {canCheckout ? "Continuar para checkout" : "Entrar para finalizar"}{" "}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
        {!canCheckout ? (
          <p className="cart-checkout-note">
            Entre numa conta de cliente para confirmar a morada e o pedido.
          </p>
        ) : null}
        <Link href="/produtos" className="cart-continue-shopping">
          Continuar a explorar
        </Link>
      </aside>
    </div>
  );
}
