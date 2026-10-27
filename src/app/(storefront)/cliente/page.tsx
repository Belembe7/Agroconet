import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CheckoutService } from "@/services/checkout/checkout-service";
import { PriceTag } from "@/components/shared/price-tag";
import { displayName } from "@/lib/display-name";

export default function ClienteHomePage() {
  return (
    <Suspense fallback={<p className="p-6">A carregar a sua conta…</p>}>
      <ClienteHomeContent />
    </Suspense>
  );
}

async function ClienteHomeContent() {
  await connection();
  const session = await getAppSession();
  const orders = session
    ? await new CheckoutService(prisma).orders(session.user.id)
    : [];
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-foreground text-2xl font-semibold">
          Olá, {session?.user.name ? displayName(session.user.name) : ""}
        </h2>
        <p className="text-muted-foreground">
          Acompanhe os seus pedidos e dados de entrega.
        </p>
      </header>
      <nav className="flex flex-wrap gap-3">
        <Link className="rounded-full border px-4 py-2" href="/cliente/pedidos">
          Os meus pedidos
        </Link>
        <Link className="rounded-full border px-4 py-2" href="/cliente/moradas">
          Moradas
        </Link>
        <Link className="rounded-full border px-4 py-2" href="/favoritos">
          Favoritos
        </Link>
      </nav>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Pedidos recentes</h3>
        {orders.length ? (
          orders.slice(0, 5).map((order) => (
            <Link
              key={order.id}
              href={`/cliente/pedidos/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
            >
              <span>
                <strong>{order.number}</strong>
                <br />
                <small>
                  {new Intl.DateTimeFormat("pt-MZ", {
                    dateStyle: "medium",
                  }).format(order.createdAt)}{" "}
                  · {order.status}
                </small>
              </span>
              <PriceTag cents={order.totalCents} />
            </Link>
          ))
        ) : (
          <p className="text-muted-foreground rounded-xl border p-5">
            Ainda não fez nenhum pedido.{" "}
            <Link className="underline" href="/produtos">
              Explorar produtos
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
