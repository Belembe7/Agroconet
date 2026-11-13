import { Suspense } from "react";
import { connection } from "next/server";
import { formatPrice } from "@/lib/format";
import { displayName } from "@/lib/display-name";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminService } from "@/services/admin/admin-service";
import { DeliveryService } from "@/services/delivery/delivery-service";
import { approveDriverAction, reviewSellerAction } from "@/features/admin/actions";
import {
  assignDeliveryAction,
  createZoneAction,
} from "@/features/delivery/actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionFeedbackForm } from "@/components/shared/action-feedback-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";

export default function AdminHomePage() {
  return (
    <Suspense fallback={<p className="p-6">A carregar painel…</p>}>
      <AdminHomeContent />
    </Suspense>
  );
}

async function AdminHomeContent() {
  await connection();
  const session = await getAppSession();
  if (!session) return null;
  const [data, operations, dispatch] = await Promise.all([
    new AdminService(prisma).overview(session.actor),
    new AdminService(prisma).listCatalogAndOperations(session.actor),
    new DeliveryService(prisma).listDispatch(session.actor),
  ]);
  const stats = [
    ["Encomendas", data.stats.orders],
    ["Vendedores", data.stats.sellers],
    ["Produtos", data.stats.products],
    ["Entregadores", data.stats.drivers],
    ["Entregas", data.stats.deliveries],
    ["Recebido", formatPrice(data.stats.paidCents)],
  ];
  return (
    <div className="space-y-8">
      <header>
        <p className="text-muted-foreground text-sm">Operação Agroconet</p>
        <h1 className="text-2xl font-semibold">Painel administrativo</h1>
      </header>
      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        {stats.map(([label, value]) => (
          <article
            key={String(label)}
            className="bg-card rounded-2xl border p-4"
          >
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="bg-card rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">
            Vendedores por aprovar ({data.pendingSellers.length})
          </h2>
          {data.pendingSellers.length ? (
            <ul className="divide-y">
              {data.pendingSellers.map((seller) => (
                <li
                  key={seller.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {displayName(seller.businessName)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {seller.district}, {seller.province}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ActionFeedbackForm
                      action={reviewSellerAction}
                      successMessage="Vendedor aprovado."
                      errorMessage="Não foi possível aprovar o vendedor. Atualize o painel e tente novamente."
                    >
                      <input type="hidden" name="id" value={seller.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <Button size="sm">Aprovar</Button>
                    </ActionFeedbackForm>
                    <ActionFeedbackForm
                      action={reviewSellerAction}
                      className="flex gap-2"
                      successMessage="Decisão sobre o vendedor guardada."
                      errorMessage="Não foi possível rejeitar o vendedor. Atualize o painel e tente novamente."
                    >
                      <input type="hidden" name="id" value={seller.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <Input
                        name="reason"
                        placeholder="Motivo"
                        maxLength={500}
                        aria-label="Motivo da rejeição"
                        className="w-28"
                      />
                      <Button size="sm" variant="destructive">
                        Rejeitar
                      </Button>
                    </ActionFeedbackForm>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Sem vendedores pendentes.
            </p>
          )}
        </section>
        <section className="bg-card rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">Despacho de entregas</h2>
          {dispatch.deliveries.length ? (
            <ul className="divide-y">
              {dispatch.deliveries.map((delivery) => (
                <li key={delivery.id} className="space-y-2 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {delivery.sellerOrder.order.number} ·{" "}
                      {displayName(delivery.sellerOrder.seller.businessName)}
                    </p>
                    <StatusBadge
                      tone={delivery.status === "FAILED" ? "danger" : "warning"}
                    >
                      {delivery.status}
                    </StatusBadge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Tentativa {delivery.attempts + 1}
                  </p>
                  <ActionFeedbackForm
                    action={assignDeliveryAction}
                    className="flex flex-wrap gap-2"
                    successMessage="Entrega atribuída ao entregador."
                    errorMessage="Não foi possível atribuir a entrega. Verifique a disponibilidade e tente novamente."
                  >
                    <input
                      type="hidden"
                      name="deliveryId"
                      value={delivery.id}
                    />
                    <select
                      name="driverId"
                      required
                      aria-label="Entregador disponível"
                      className="border-input bg-background min-h-10 flex-1 rounded-lg border px-3 text-sm"
                    >
                      <option value="">Escolher entregador da zona</option>
                      {dispatch.drivers
                        .filter(
                          (driver) =>
                            !delivery.zoneId ||
                            driver.zones.some(
                              (zone) => zone.zoneId === delivery.zoneId,
                            ),
                        )
                        .map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {displayName(driver.user.name)} ·{" "}
                            {driver.vehicleType}
                          </option>
                        ))}
                    </select>
                    <Button size="sm">Atribuir</Button>
                  </ActionFeedbackForm>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Não há entregas por atribuir ou reatribuir.
            </p>
          )}
        </section>
        <section className="bg-card space-y-4 rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Criar zona de entrega</h2>
          <ActionFeedbackForm
            action={createZoneAction}
            className="grid gap-3 sm:grid-cols-2"
            successMessage="Zona de entrega criada."
            errorMessage="Não foi possível criar a zona. Verifique os dados e tente novamente."
          >
            <Input
              name="name"
              placeholder="Nome da zona"
              required
              minLength={2}
            />
            <Input
              name="province"
              placeholder="Província"
              required
              minLength={2}
            />
            <Input
              name="areas"
              placeholder="Bairros separados por vírgula"
              required
              className="sm:col-span-2"
            />
            <label className="text-muted-foreground text-sm">
              Taxa base (Mzn)
              <NumericInput name="baseFeeMzn" min="0" step="0.01" required />
            </label>
            <div className="flex items-end">
              <Button>Criar zona</Button>
            </div>
          </ActionFeedbackForm>
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="bg-card rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">Encomendas recentes</h2>
          {data.recentOrders.length ? (
            <ul className="divide-y">
              {data.recentOrders.map((order) => (
                <li key={order.id} className="flex justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">
                      {order.number} · {displayName(order.user.name)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {order.status} ·{" "}
                      {order.createdAt.toLocaleDateString("pt-MZ")}
                    </p>
                  </div>
                  <span>{formatPrice(order.totalCents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Ainda não há encomendas.
            </p>
          )}
        </section>
        <section className="bg-card rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">Auditoria recente</h2>
          {operations.auditLogs.length ? (
            <ul className="divide-y">
              {operations.auditLogs.map((entry) => (
                <li key={entry.id} className="py-3">
                  <p className="font-medium">
                    {entry.action} · {entry.entityType}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {entry.actorRole ?? "Sistema"} ·{" "}
                    {entry.createdAt.toLocaleString("pt-MZ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Sem eventos registados.
            </p>
          )}
        </section>
      </div>
      <section className="bg-card space-y-4 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Entregadores registados</h2>
        {operations.drivers.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {operations.drivers.map((driver) => (
              <li
                key={driver.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div>
                  <p className="font-medium">{displayName(driver.user.name)}</p>
                  <p className="text-muted-foreground text-sm">
                    {driver.vehicleType} · {driver.availability}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    tone={driver.status === "ACTIVE" ? "success" : "warning"}
                  >
                    {driver.status}
                  </StatusBadge>
                  {driver.status === "PENDING" && (
                    <ActionFeedbackForm
                      action={approveDriverAction}
                      successMessage="Entregador aprovado."
                      errorMessage="Não foi possível aprovar o entregador. Atualize o painel e tente novamente."
                    >
                      <input type="hidden" name="id" value={driver.id} />
                      <Button size="sm">Aprovar</Button>
                    </ActionFeedbackForm>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Ainda não há entregadores.
          </p>
        )}
      </section>
    </div>
  );
}
