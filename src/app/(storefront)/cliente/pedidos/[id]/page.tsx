import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PriceTag } from "@/components/shared/price-tag";
import { displayName } from "@/lib/display-name";
import { OrderCreatedNotice } from "@/features/checkout/order-created-notice";
export default function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pedido?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6">A carregar pedido…</p>}>
      <OrderDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pedido?: string }>;
}) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const session = await getAppSession();
  const order = session
    ? await prisma.order.findFirst({
        where: { id, userId: session.user.id },
        include: {
          sellerOrders: {
            include: {
              seller: { select: { businessName: true } },
              items: true,
            },
          },
          payments: { select: { method: true, status: true } },
        },
      })
    : null;
  if (!order) notFound();
  return (
    <article className="space-y-6">
      {query.pedido === "feito" ? (
        <OrderCreatedNotice orderNumber={order.number} />
      ) : null}
      <header>
        <p className="guide-eyebrow">PEDIDO</p>
        <h2 className="text-2xl font-semibold">{order.number}</h2>
        <p>
          {order.status} ·{" "}
          {new Intl.DateTimeFormat("pt-MZ", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(order.createdAt)}
        </p>
      </header>
      {order.sellerOrders.map((group) => (
        <section
          className="space-y-2 rounded-xl border bg-white p-5"
          key={group.id}
        >
          <h3 className="font-semibold">
            {displayName(group.seller.businessName)}
          </h3>
          {group.items.map((item) => (
            <div className="flex justify-between" key={item.id}>
              <span>
                {item.quantity} × {displayName(item.productName)} ·{" "}
                {item.variantLabel}
              </span>
              <PriceTag cents={item.lineTotalCents} />
            </div>
          ))}
        </section>
      ))}
      <section className="rounded-xl border bg-white p-5">
        <p>
          Pagamento: {order.payments[0]?.method} · {order.payments[0]?.status}
        </p>
        <p className="mt-2 flex justify-between font-semibold">
          Total <PriceTag cents={order.totalCents} />
        </p>
        <p className="mt-3 text-sm">
          Entrega:{" "}
          {displayName(
            String(
              (order.shippingAddressSnapshot as { neighborhood?: string })
                .neighborhood ?? "Morada registada",
            ),
          )}
          ,{" "}
          {displayName(
            String(
              (order.shippingAddressSnapshot as { district?: string })
                .district ?? "",
            ),
          )}
        </p>
      </section>
    </article>
  );
}
