"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  removeCartItemAction,
  setCartItemQuantityAction,
} from "@/features/cart/actions";

export function CartItemControls({
  itemId,
  quantity,
  available,
}: {
  itemId: string;
  quantity: number;
  available: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function setQuantity(next: number) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await setCartItemQuantityAction(itemId, next);
        if (!result.ok) setError(result.error);
        else {
          toast.success("Quantidade do produto atualizada.");
          router.refresh();
        }
      } catch {
        setError("Não foi possível atualizar a quantidade. Tente novamente.");
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await removeCartItemAction(itemId);
        if (!result.ok) setError(result.error);
        else {
          toast.success("Produto removido do carrinho.");
          router.refresh();
        }
      } catch {
        setError("Não foi possível remover o produto. Tente novamente.");
      }
    });
  }

  const canDecrease = quantity > 1 && quantity - 1 <= available;
  const canIncrease = quantity < 99 && quantity < available;

  return (
    <div className="cart-item-controls">
      <div className="cart-quantity-control" aria-label="Alterar quantidade">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={pending || !canDecrease}
          onClick={() => setQuantity(quantity - 1)}
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <span aria-live="polite">{quantity}</span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={pending || !canIncrease}
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
      <button
        type="button"
        className="cart-remove-button"
        disabled={pending}
        onClick={remove}
      >
        <Trash2 aria-hidden="true" className="size-4" /> Remover
      </button>
      {error ? (
        <p role="alert" className="cart-action-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
