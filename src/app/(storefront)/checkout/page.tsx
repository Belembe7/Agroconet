import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getCurrentCartSnapshot } from "@/features/cart/server";
import { CheckoutService } from "@/services/checkout/checkout-service";
import { placeOrderAction } from "@/features/checkout/actions";
import { CheckoutSubmitButton } from "@/features/checkout/checkout-submit-button";
import { PriceTag } from "@/components/shared/price-tag";
import { randomUUID } from "node:crypto";
import { Suspense } from "react";
import { connection } from "next/server";
import { displayName } from "@/lib/display-name";

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-12">
          A preparar o checkout…
        </main>
      }
    >
      <CheckoutContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutContent({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const checkoutError = Array.isArray(params.erro)
    ? params.erro[0]
    : params.erro;
  const session = await getAppSession();
  if (!session?.actor.roles.includes("CUSTOMER"))
    redirect("/entrar?next=%2Fcheckout");
  const [cart, addresses] = await Promise.all([
    getCurrentCartSnapshot(),
    new CheckoutService(prisma).addresses(session.user.id),
  ]);
  if (!cart.itemCount) redirect("/carrinho");
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      {checkoutError === "dados" || checkoutError === "pedido" ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {checkoutError === "dados"
            ? "Escolha uma morada e uma forma de pagamento válidas antes de submeter o pedido."
            : "O pedido não foi concluído. Verifique o carrinho e tente novamente."}
        </p>
      ) : null}
      <header>
        <p className="guide-eyebrow">FINALIZAR COMPRA</p>
        <h1 className="text-4xl font-semibold">Entrega e pagamento</h1>
        <p>Confirme os seus dados para submeter o pedido.</p>
      </header>
      {!addresses.length ? (
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Adicione uma morada</h2>
          <p className="my-3">
            Precisa de uma morada de entrega antes de concluir o pedido.
          </p>
          <Link className="underline" href="/cliente/moradas">
            Gerir moradas
          </Link>
        </section>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
          <form
            action={placeOrderAction}
            className="space-y-6 rounded-2xl border bg-white p-6"
          >
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <fieldset className="space-y-3">
              <legend className="mb-3 text-xl font-semibold">
                Morada de entrega
              </legend>
              {addresses.map((address) => (
                <label
                  className="flex gap-3 rounded-xl border p-4"
                  key={address.id}
                >
                  <input
                    required
                    type="radio"
                    name="addressId"
                    value={address.id}
                    defaultChecked={address.isDefault || addresses.length === 1}
                  />
                  <span>
                    <strong>
                      {displayName(address.label)} ·{" "}
                      {displayName(address.recipientName)}
                    </strong>
                    <br />
                    {displayName(address.neighborhood)},{" "}
                    {displayName(address.district)},{" "}
                    {displayName(address.province)}
                    <br />
                    Contacto: {address.phone}
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-xl font-semibold">Pagamento</legend>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  required
                  defaultChecked
                />
                Pagamento na entrega
              </label>
            </fieldset>
            <p className="text-muted-foreground text-sm">
              Pagamento na entrega, com confirmação manual pelo entregador.
            </p>
            <CheckoutSubmitButton />
          </form>
          <aside className="h-fit rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Resumo</h2>
            {cart.groups.map((group) => (
              <div className="mt-4 border-b pb-3" key={group.sellerId}>
                <strong>{group.sellerName}</strong>
                {group.items.map((item) => (
                  <p key={item.id}>
                    {item.quantity} × {item.productName} —{" "}
                    <PriceTag cents={item.lineTotalCents} />
                  </p>
                ))}
              </div>
            ))}
            <p className="mt-4 flex justify-between font-semibold">
              <span>Total</span>
              <PriceTag cents={cart.totalCents} />
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Entrega será combinada com o vendedor.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
