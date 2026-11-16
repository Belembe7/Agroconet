import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  MapPinned,
  MessageCircleMore,
  PackageCheck,
  UsersRound,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { displayName } from "@/lib/display-name";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminService } from "@/services/admin/admin-service";
import { DeliveryService } from "@/services/delivery/delivery-service";
import {
  approveDriverAction,
  reviewSellerAction,
} from "@/features/admin/actions";
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
    {
      label: "Produtos no catálogo",
      value: data.stats.products,
      detail: `${data.stats.pendingProducts} pendente(s) de revisão`,
      href: "/admin/produtos",
      icon: PackageCheck,
    },
    {
      label: "Categorias",
      value: data.stats.categories,
      detail: "Categorias configuradas",
      href: "/admin/produtos?section=categorias",
      icon: Boxes,
    },
    {
      label: "Vendedores",
      value: data.stats.sellers,
      detail: `${data.stats.pendingSellers} por aprovar`,
      href: "#vendedores-pendentes",
      icon: UsersRound,
    },
    {
      label: "Entregadores",
      value: data.stats.drivers,
      detail: `${data.stats.pendingDrivers} por aprovar`,
      href: "#entregadores-registados",
      icon: ClipboardCheck,
    },
    {
      label: "Encomendas",
      value: data.stats.orders,
      detail: `${data.stats.deliveries} entrega(s) registada(s)`,
      href: "#despacho-entregas",
      icon: MapPinned,
    },
    {
      label: "Pagamentos recebidos",
      value: formatPrice(data.stats.paidCents),
      detail: "Pagamentos marcados como pagos",
      href: null,
      icon: ClipboardCheck,
    },
  ];
  const attentionCount =
    data.stats.pendingProducts +
    data.stats.pendingSellers +
    data.stats.pendingDrivers +
    dispatch.deliveries.length;
  const attentionHref = data.stats.pendingProducts
    ? "/admin/produtos?section=pendentes"
    : data.stats.pendingSellers
      ? "#vendedores-pendentes"
      : data.stats.pendingDrivers
        ? "#entregadores-registados"
        : "#despacho-entregas";
  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
            Agroconet · Administração
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            Visão geral da operação
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe o catálogo e as tarefas que precisam de atenção.
          </p>
        </div>
        <Link
          href="/admin/apoio"
          className="text-primary inline-flex min-h-10 items-center gap-2 self-start text-sm font-medium hover:underline sm:self-auto"
        >
          <MessageCircleMore aria-hidden="true" className="size-4" />{" "}
          Atendimento
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </header>
      <section
        aria-label="Acessos rápidos"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {[
          {
            href: "/admin/produtos",
            label: "Gerir produtos",
            icon: PackageCheck,
          },
          {
            href: "/admin/produtos?section=pendentes",
            label: "Rever produtos",
            icon: ClipboardCheck,
          },
          {
            href: "/admin/produtos?section=categorias",
            label: "Gerir categorias",
            icon: Boxes,
          },
          { href: "/entrega", label: "Mapa de entregas", icon: MapPinned },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-card hover:bg-muted/60 focus-visible:outline-ring flex min-h-12 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4"
            >
              <Icon
                aria-hidden="true"
                className="text-primary size-4 shrink-0"
              />
              <span className="min-w-0 flex-1">{item.label}</span>
              <ArrowUpRight
                aria-hidden="true"
                className="text-muted-foreground size-3.5 shrink-0"
              />
            </Link>
          );
        })}
      </section>
      <section
        aria-label="Tarefas que precisam de atenção"
        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${attentionCount ? "border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20" : "bg-card"}`}
      >
        <div>
          <p className="font-semibold">
            {attentionCount
              ? `${attentionCount} tarefa(s) por tratar`
              : "Tudo em dia"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {data.stats.pendingSellers} vendedor(es),{" "}
            {data.stats.pendingProducts} produto(s), {data.stats.pendingDrivers}{" "}
            entregador(es) e {dispatch.deliveries.length} entrega(s) aguardam
            atenção.
          </p>
        </div>
        <Link
          href={attentionHref}
          className="text-primary inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-medium hover:underline"
        >
          Ver tarefas <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 xl:grid-cols-3"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <Icon
                  aria-hidden="true"
                  className="text-primary size-4 shrink-0"
                />
              </div>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {stat.detail}
              </p>
            </>
          );
          const className = "bg-card rounded-2xl border p-4 sm:p-5";
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className={`${className} hover:border-primary/40 focus-visible:outline-ring transition-colors focus-visible:outline-2 focus-visible:outline-offset-2`}
            >
              {content}
            </Link>
          ) : (
            <article key={stat.label} className={className}>
              {content}
            </article>
          );
        })}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section
          id="vendedores-pendentes"
          className="bg-card rounded-2xl border p-5"
        >
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
                        required
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
        <section
          id="despacho-entregas"
          className="bg-card rounded-2xl border p-5"
        >
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
              aria-label="Nome da zona"
              required
              minLength={2}
            />
            <Input
              name="province"
              placeholder="Província"
              aria-label="Província da zona"
              required
              minLength={2}
            />
            <Input
              name="areas"
              placeholder="Bairros separados por vírgula"
              aria-label="Bairros da zona, separados por vírgula"
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
        <section
          id="encomendas-recentes"
          className="bg-card rounded-2xl border p-5"
        >
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
      <section
        id="entregadores-registados"
        className="bg-card space-y-4 rounded-2xl border p-5"
      >
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
