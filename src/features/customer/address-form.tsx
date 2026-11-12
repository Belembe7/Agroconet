"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveAddressAction } from "@/features/customer/actions";

const fields = [
  { name: "label", label: "Nome da morada" },
  { name: "recipientName", label: "Destinatário" },
  { name: "phone", label: "Telefone" },
  { name: "province", label: "Província" },
  { name: "district", label: "Distrito" },
  { name: "neighborhood", label: "Bairro / localidade" },
  { name: "street", label: "Rua (opcional)" },
  { name: "reference", label: "Ponto de referência" },
] as const;

export function AddressForm() {
  const [state, action, pending] = useActionState(saveAddressAction, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form
      ref={form}
      action={action}
      className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2"
    >
      <h3 className="text-xl font-semibold sm:col-span-2">Adicionar morada</h3>
      {fields.map(({ name, label, ...field }) => (
        <label className="grid gap-1 text-sm" key={name}>
          {label}
          <input
            className="rounded-lg border px-3"
            name={name}
            type={name === "phone" ? "tel" : "text"}
            autoComplete={
              name === "recipientName"
                ? "name"
                : name === "phone"
                  ? "tel"
                  : undefined
            }
            maxLength={name === "phone" ? 30 : undefined}
            required={name !== "street"}
          />
        </label>
      ))}
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isDefault" />
        Definir como principal
      </label>
      {state && !state.ok ? (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-green-800 sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      <button
        className="bg-primary rounded-full px-5 py-3 font-semibold sm:col-span-2"
        type="submit"
        disabled={pending}
      >
        {pending ? "A guardar morada…" : "Guardar morada"}
      </button>
    </form>
  );
}
