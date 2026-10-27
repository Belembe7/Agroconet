import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CheckoutService } from "@/services/checkout/checkout-service";
import { PriceTag } from "@/components/shared/price-tag";
export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={<p className="p-6">A carregar pedidos…</p>}>
      <CustomerOrdersContent />
    </Suspense>
  );
}

async function CustomerOrdersContent() {
  await connection();
  const session = await getAppSession();
  const orders = session
    ? await new CheckoutService(prisma).orders(session.user.id)
    : [];
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Os meus pedidos</h2>
      {orders.length ? (
        orders.map((order) => (
          <Link
            key={order.id}
            href={`/cliente/pedidos/${order.id}`}
            className="flex justify-between rounded-xl border bg-white p-4"
          >
            <span>
              <strong>{order.number}</strong>
              <br />
              <small>
                {order.status} ·{" "}
                {new Intl.DateTimeFormat("pt-MZ", {
                  dateStyle: "medium",
                }).format(order.createdAt)}
              </small>
            </span>
            <PriceTag cents={order.totalCents} />
          </Link>
        ))
      ) : (
        <p>Ainda não tem pedidos.</p>
      )}
    </section>
  );
}
