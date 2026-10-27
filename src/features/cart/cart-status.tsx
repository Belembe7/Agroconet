import Link from "next/link";
import { connection } from "next/server";
import { ShoppingBag } from "lucide-react";
import { getCurrentCartSnapshot } from "@/features/cart/server";

export async function CartStatus() {
  await connection();
  let count = 0;
  try {
    count = (await getCurrentCartSnapshot()).itemCount;
  } catch {
    // The cart link remains available if its count cannot be loaded.
  }
  return (
    <Link
      prefetch={false}
      className="store-cart-link"
      href="/carrinho"
      aria-label={`Carrinho${count ? `, ${count} artigos` : ""}`}
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      <span>Carrinho</span>
      {count ? (
        <span className="store-cart-count" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
