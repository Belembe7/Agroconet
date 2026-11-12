"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function CartStatusLink({
  count,
  locale,
}: {
  count: number;
  locale: "pt" | "en";
}) {
  const previousCount = useRef(count);
  const timeoutId = useRef<number | undefined>(undefined);
  const [isPulsing, setIsPulsing] = useState(false);

  const signalAddition = useCallback(() => {
    setIsPulsing(true);
    window.clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(() => setIsPulsing(false), 850);
  }, []);

  useEffect(() => {
    const onCartAdded = () => signalAddition();
    window.addEventListener("agroconet:cart-added", onCartAdded);
    return () => {
      window.removeEventListener("agroconet:cart-added", onCartAdded);
      window.clearTimeout(timeoutId.current);
    };
  }, [signalAddition]);

  useEffect(() => {
    if (count > previousCount.current) signalAddition();
    previousCount.current = count;
  }, [count, signalAddition]);

  const label = locale === "en" ? "Cart" : "Carrinho";
  const countLabel = locale === "en" ? "items" : "artigos";

  return (
    <Link
      prefetch={false}
      className="store-cart-link"
      href="/carrinho"
      aria-label={`${label}${count ? `, ${count} ${countLabel}` : ""}`}
    >
      <ShoppingBag
        aria-hidden="true"
        className={isPulsing ? "store-cart-icon-pulse size-5" : "size-5"}
      />
      <span>{label}</span>
      {count ? (
        <span
          className={
            isPulsing
              ? "store-cart-count store-cart-count-pulse"
              : "store-cart-count"
          }
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">
        {isPulsing
          ? locale === "en"
            ? `Cart updated. ${count} ${countLabel}.`
            : `Carrinho atualizado. ${count} ${countLabel}.`
          : ""}
      </span>
    </Link>
  );
}
