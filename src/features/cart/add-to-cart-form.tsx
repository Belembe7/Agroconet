"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/shared/price-tag";
import { addToCartAction } from "@/features/cart/actions";

type VariantOption = {
  id: string;
  label: string;
  priceCents: number;
  available: number;
  isDefault: boolean;
};

export function AddToCartForm({
  productSlug,
  variants,
}: {
  productSlug: string;
  variants: VariantOption[];
}) {
  const [selectedId, setSelectedId] = useState(
    variants.find((variant) => variant.isDefault && variant.available > 0)
      ?.id ??
      variants.find((variant) => variant.available > 0)?.id ??
      variants[0]?.id ??
      "",
  );
  const [state, formAction, pending] = useActionState(addToCartAction, null);
  const router = useRouter();
  const selected = variants.find((variant) => variant.id === selectedId);
  const available = selected?.available ?? 0;

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [router, state]);

  if (!variants.length)
    return (
      <p className="product-unavailable">
        Este produto não tem opções disponíveis.
      </p>
    );

  return (
    <form action={formAction} className="add-to-cart-form">
      <input type="hidden" name="productSlug" value={productSlug} />
      <label htmlFor="product-variant">Opção de compra</label>
      <select
        id="product-variant"
        name="variantId"
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
      >
        {variants.map((variant) => (
          <option
            key={variant.id}
            value={variant.id}
            disabled={variant.available < 1}
          >
            {variant.label} ·{" "}
            {variant.available > 0
              ? `${variant.available} em stock`
              : "sem stock"}
          </option>
        ))}
      </select>
      {selected ? (
        <p className="add-to-cart-price">
          <PriceTag cents={selected.priceCents} />
        </p>
      ) : null}
      <label htmlFor="product-quantity">Quantidade</label>
      <input
        id="product-quantity"
        name="quantity"
        type="number"
        min="1"
        max={Math.min(99, available || 1)}
        defaultValue="1"
        disabled={available < 1}
      />
      <Button
        type="submit"
        disabled={pending || available < 1}
        className="w-full"
      >
        <ShoppingCart aria-hidden="true" className="size-4" />
        {pending
          ? "A adicionar…"
          : available > 0
            ? "Adicionar ao carrinho"
            : "Sem stock disponível"}
      </Button>
      {state?.ok ? (
        <p role="status" className="cart-add-success">
          <Check aria-hidden="true" className="size-4" /> {state.message}{" "}
          <Link href="/carrinho">Ver carrinho</Link>
        </p>
      ) : null}
      {state && !state.ok ? (
        <p role="alert" className="cart-action-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
