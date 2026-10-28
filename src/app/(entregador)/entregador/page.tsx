import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { DeliveryService } from "@/services/delivery/delivery-service";
import {
  deliveryTransitionAction,
  toggleAvailabilityAction,
} from "@/features/delivery/actions";
import { formatPrice } from "@/lib/format";
import { displayName } from "@/lib/display-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import type { DeliveryStatus } from "@/generated/prisma/client";

const labels: Partial<Record<DeliveryStatus, string>> = {
  ACCEPTED: "Aceitar entrega",
  EN_ROUTE_TO_PICKUP: "A caminho da recolha",
  PICKED_UP: "Encomenda recolhida",
  EN_ROUTE_TO_CUSTOMER: "A caminho do cliente",
  DELIVERED: "Confirmar entrega",
  FAILED: "Registar falha",
};
const nextStates: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  ASSIGNED: ["ACCEPTED", "UNASSIGNED"],
  ACCEPTED: ["EN_ROUTE_TO_PICKUP"],
  EN_ROUTE_TO_PICKUP: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["EN_ROUTE_TO_CUSTOMER", "FAILED"],
  EN_ROUTE_TO_CUSTOMER: ["DELIVERED", "FAILED"],
};

function addressText(value: unknown) {
  if (!value || typeof value !== "object") return "Endereço não disponível";
  const row = value as Record<string, unknown>;
  return displayName(
    [
      row.recipientName,
      row.neighborhood,
      row.district,
      row.province,
      row.reference,
    ]
      .filter((part) => typeof part === "string" && part)
      .join(" · ") || "Endereço não disponível",
  );
}

export default function DriverHomePage() {
  return (
    <Suspense fallback={<p className="p-6">A carregar entregas…</p>}>
      <DriverHomeContent />
    </Suspense>
  );
}

async function DriverHomeContent() {
  await connection();
  const session = await getAppSession();
  if (!session) return null;
  const { driver, deliveries, completed, earnings, pendingEarningsCount } =
    await new DeliveryService(prisma).driverDashboard(session.actor);
  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted-foreground text-sm">
          Olá, {displayName(session.user.name)}
        </p>
        <h1 className="text-2xl font-semibold">As minhas entregas</h1>
      </header>
      <section className="bg-card grid grid-cols-2 gap-3 rounded-2xl border p-4">
        <div>
          <p className="text-muted-foreground text-sm">Ganhos por liquidar</p>
          <p className="text-xl font-semibold">{formatPrice(earnings)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Entregas activas</p>
          <p className="text-xl font-semibold">{deliveries.length}</p>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t pt-3">
          <div>
            <p className="font-medium">Disponibilidade</p>
            <p className="text-muted-foreground text-sm">
              {driver.availability === "AVAILABLE"
                ? "Disponível para receber entregas"
                : driver.availability === "BUSY"
                  ? "Em entrega"
                  : "Offline"}
            </p>
          </div>
          <form action={toggleAvailabilityAction}>
            <input
              type="hidden"
              name="available"
              value={driver.availability !== "AVAILABLE" ? "true" : "false"}
            />
            <Button variant="outline" disabled={driver.availability === "BUSY"}>
              {driver.availability === "AVAILABLE"
                ? "Ficar offline"
                : "Ficar disponível"}
            </Button>
          </form>
        </div>
        <p className="text-muted-foreground col-span-2 text-xs">
          {pendingEarningsCount} entregas concluídas aguardam reconciliação.
        </p>
      </section>
      {deliveries.length ? (
        <ul className="space-y-4">
          {deliveries.map((delivery) => (
            <li
              key={delivery.id}
              className="bg-card space-y-4 rounded-2xl border p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Encomenda {delivery.sellerOrder.order.number}
                  </p>
                  <h2 className="font-semibold">
                    {displayName(delivery.sellerOrder.seller.businessName)}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Recolha · {delivery.sellerOrder.seller.phone}
                  </p>
                </div>
                <StatusBadge
                  tone={delivery.status === "FAILED" ? "danger" : "warning"}
                >
                  {delivery.status.replaceAll("_", " ")}
                </StatusBadge>
              </div>
              <div className="bg-muted/40 space-y-2 rounded-xl p-3">
                <p className="text-sm">
                  {addressText(delivery.pickupAddressSnapshot)}
                </p>
                <p className="text-sm font-medium">
                  Destino · {addressText(delivery.dropoffAddressSnapshot)}
                </p>
                <p className="text-sm">
                  Contacto do cliente ·{" "}
                  {delivery.sellerOrder.order.contactPhone}
                </p>
                <p className="text-sm">
                  Ganho desta entrega · {formatPrice(delivery.driverFeeCents)}
                </p>
              </div>
              <Link
                className="text-primary inline-flex min-h-11 items-center text-sm underline"
                href={`/entrega?entrega=${delivery.id}`}
              >
                Ver percurso no mapa
              </Link>
              {delivery.sellerOrder.seller.latitude &&
                delivery.sellerOrder.seller.longitude && (
                  <a
                    className="text-primary inline-flex min-h-11 items-center text-sm underline"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${delivery.sellerOrder.seller.latitude},${delivery.sellerOrder.seller.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Navegar até ao vendedor
                  </a>
                )}
              {nextStates[delivery.status]?.map((next) => (
                <form
                  key={next}
                  action={deliveryTransitionAction}
                  className="space-y-2"
                >
                  <input type="hidden" name="id" value={delivery.id} />
                  <input type="hidden" name="status" value={next} />
                  {next === "DELIVERED" && (
                    <Input
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      minLength={6}
                      maxLength={6}
                      placeholder="Código de confirmação do cliente"
                      required
                    />
                  )}
                  {next === "FAILED" && (
                    <Input
                      name="note"
                      placeholder="Motivo da falha"
                      required
                      minLength={3}
                    />
                  )}
                  <Button
                    className="w-full"
                    variant={
                      next === "UNASSIGNED" || next === "FAILED"
                        ? "outline"
                        : "default"
                    }
                  >
                    {next === "UNASSIGNED"
                      ? "Recusar entrega"
                      : (labels[next] ?? next)}
                  </Button>
                </form>
              ))}
              {delivery.statusHistory.length > 0 && (
                <details className="text-sm">
                  <summary className="min-h-11 cursor-pointer py-3 font-medium">
                    Histórico recente
                  </summary>
                  <ul className="space-y-2">
                    {delivery.statusHistory.map((entry, i) => (
                      <li
                        key={`${entry.toStatus}-${entry.createdAt.toISOString()}-${i}`}
                        className="text-muted-foreground"
                      >
                        {entry.toStatus.replaceAll("_", " ")} ·{" "}
                        {entry.createdAt.toLocaleString("pt-MZ")}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <section className="bg-card rounded-2xl border p-6 text-center">
          <h2 className="font-semibold">Sem entregas activas</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Quando uma entrega for atribuída, ela aparecerá aqui.
          </p>
        </section>
      )}
      <section className="bg-card space-y-3 rounded-2xl border p-5">
        <h2 className="font-semibold">Entregas concluídas</h2>
        {completed.length ? (
          <ul className="divide-y">
            {completed.map((delivery) => (
              <li key={delivery.id} className="flex justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">
                    {delivery.sellerOrder.order.number}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {delivery.deliveredAt?.toLocaleDateString("pt-MZ") ??
                      "Concluída"}
                  </p>
                </div>
                <span>{formatPrice(delivery.driverFeeCents)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Ainda não há entregas concluídas.
          </p>
        )}
      </section>
    </div>
  );
}
