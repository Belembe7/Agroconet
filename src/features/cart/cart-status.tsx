import Link from "next/link";
import { connection } from "next/server";
import { ShoppingBag } from "lucide-react";
import { CartStatusLink } from "@/features/cart/cart-status-link";
import { getCurrentCartSnapshot } from "@/features/cart/server";

export async function CartStatus({ locale = "pt" }: { locale?: "pt" | "en" }) {
  await connection();
  let count = 0;
  try {
    count = (await getCurrentCartSnapshot()).itemCount;
  } catch {
    // The cart link remains available if its count cannot be loaded.
  }
  return <CartStatusLink count={count} locale={locale} />;
}

export function CartStatusFallback({
  locale = "pt",
}: {
  locale?: "pt" | "en";
}) {
  return (
    <Link
      prefetch={false}
      className="store-cart-link"
      href="/carrinho"
      aria-label={locale === "en" ? "Cart" : "Carrinho"}
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      <span>{locale === "en" ? "Cart" : "Carrinho"}</span>
    </Link>
  );
}
