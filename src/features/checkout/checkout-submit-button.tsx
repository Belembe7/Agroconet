"use client";

import { useFormStatus } from "react-dom";

export function CheckoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="bg-primary rounded-full px-6 py-3 font-semibold disabled:cursor-wait disabled:opacity-70"
      type="submit"
      disabled={pending}
    >
      {pending ? "A submeter pedido…" : "Submeter pedido"}
    </button>
  );
}
