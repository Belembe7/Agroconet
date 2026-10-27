import { Suspense } from "react";
import Image from "next/image";
import { connection } from "next/server";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { displayDescription, displayName } from "@/lib/display-name";
import { categoryImagePosition } from "@/lib/category-image";
import { productImageUrl } from "@/lib/product-image";
import { prisma } from "@/lib/db";
import { requireAreaSession } from "@/lib/session";
import { SellerService } from "@/services/seller/seller-service";
import {
  adjustSellerStockAction,
  createSellerProductAction,
  updateSellerOrderAction,
  updateSellerProductAction,
  updateSellerProfileAction,
} from "@/features/seller/actions";

const orderStatus: Record<string, string> = {
  PENDING: "Por confirmar",
  CONFIRMED: "Confirmada",
  REJECTED: "Recusada",
  READY_FOR_PICKUP: "Pronta para recolha",
  PICKED_UP: "Recolhida",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelada",
};
const productStatus: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_REVIEW: "Em revisão",
  ACTIVE: "Ativo",
  REJECTED: "Rejeitado",
  INACTIVE: "Inativo",
  ARCHIVED: "Arquivado",
};
const units = [
  { value: "UNIT", label: "Unidade" },
  { value: "KG", label: "kg" },
  { value: "G", label: "g" },
  { value: "L", label: "L" },
  { value: "ML", label: "ml" },
  { value: "BAG", label: "Saco" },
  { value: "BOX", label: "Caixa" },
];
const inputClass =
  "border-input bg-background min-h-11 w-full rounded-lg border px-3 text-sm";

function safeProductImageUrl(storageKey: string): string | null {
  if (storageKey.startsWith("/") && !storageKey.startsWith("//"))
    return storageKey;
  try {
    const url = new URL(storageKey);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function ProductStockThumbnail({
  image,
  productName,
  categoryName,
}: {
  image: { storageKey: string; alt: string | null } | undefined;
  productName: string;
  categoryName: string;
}) {
  const imageUrl = image ? safeProductImageUrl(image.storageKey) : null;
  if (imageUrl)
    return (
      <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl border">
        <Image
          src={imageUrl}
          alt={displayName(image?.alt || productName)}
          fill
          sizes="80px"
          unoptimized={/^https?:\/\//.test(imageUrl)}
          className="object-cover"
        />
      </div>
    );

  const productFallbackImage = productImageUrl(productName);
  if (productFallbackImage)
    return (
      <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl border">
        <Image
          src={productFallbackImage}
          alt={displayName(productName)}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
    );

  const categoryPosition = categoryImagePosition(categoryName);
  if (categoryPosition)
    return (
      <div
        role="img"
        aria-label={`Imagem de ${displayName(categoryName)}`}
        className="size-20 shrink-0 rounded-xl border bg-[#f6f0e5]"
        style={{
          backgroundImage: "url('/images/agro-stock-category-sheet.png')",
          backgroundPosition: categoryPosition,
          backgroundRepeat: "no-repeat",
          backgroundSize: "300% 200%",
        }}
      />
    );

  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border bg-[#f6f0e5] text-[#47704e]">
      <Package aria-hidden="true" className="size-8" />
    </div>
  );
}

export default function VendedorHomePage() {
  return (
    <Suspense fallback={<p className="p-6">A carregar painel…</p>}>
      <VendedorHomeContent />
    </Suspense>
  );
}

async function VendedorHomeContent() {
  await connection();
  const session = await requireAreaSession("vendedor");
  const [data, categories] = await Promise.all([
    new SellerService(prisma).dashboard(session.actor),
    prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  const pending = data.orders.filter(
    (order) => order.status === "PENDING",
  ).length;
  const activeProducts = data.products.filter(
    (product) => product.status === "ACTIVE",
  ).length;
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">O meu negócio</p>
          <h1 className="font-heading mt-1 text-3xl font-semibold">
            {displayName(data.seller.businessName)}
          </h1>
          <p className="text-muted-foreground mt-2">
            Catálogo, encomendas e saldo das vendas num só lugar.
          </p>
        </div>
        <Badge
          variant={data.seller.status === "APPROVED" ? "default" : "secondary"}
        >
          {data.seller.status === "APPROVED"
            ? "Vendedor aprovado"
            : `Estado: ${data.seller.status}`}
        </Badge>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo do negócio"
      >
        <Metric
          title="Produtos ativos"
          value={String(activeProducts)}
          detail={`${data.products.length} no catálogo`}
        />
        <Metric
          title="Encomendas por tratar"
          value={String(pending)}
          detail="Aguardam confirmação"
        />
        <Metric
          title="Vendas registadas"
          value={formatPrice(data.commissions._sum.netCents ?? 0)}
          detail={`${data.commissions._count} encomendas com comissão`}
        />
        <Metric
          title="Comissões"
          value={formatPrice(data.commissions._sum.commissionCents ?? 0)}
          detail="Total calculado nas encomendas"
        />
      </section>

      <Card id="perfil">
        <CardHeader>
          <CardTitle>Perfil comercial</CardTitle>
          <p className="text-muted-foreground text-sm">
            Dados usados para apresentar a loja e organizar as recolhas.
          </p>
        </CardHeader>
        <CardContent>
          <form
            action={updateSellerProfileAction}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="Nome comercial">
              <input
                className={inputClass}
                name="businessName"
                defaultValue={displayName(data.seller.businessName)}
                maxLength={160}
                required
              />
            </Field>
            <Field label="Nome legal">
              <input
                className={inputClass}
                name="legalName"
                defaultValue={data.seller.legalName ?? ""}
              />
            </Field>
            <Field label="Telefone">
              <input
                className={inputClass}
                name="phone"
                defaultValue={data.seller.phone}
                maxLength={32}
                required
              />
            </Field>
            <Field label="Província">
              <input
                className={inputClass}
                name="province"
                defaultValue={data.seller.province}
                required
              />
            </Field>
            <Field label="Distrito">
              <input
                className={inputClass}
                name="district"
                defaultValue={data.seller.district}
                required
              />
            </Field>
            <Field label="Endereço de recolha">
              <input
                className={inputClass}
                name="addressText"
                defaultValue={displayName(data.seller.addressText)}
                required
              />
            </Field>
            <Field label="Descrição">
              <input
                className={inputClass}
                name="description"
                defaultValue={displayDescription(data.seller.description ?? "")}
                maxLength={2000}
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" variant="outline">
                Guardar perfil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card id="catalogo">
        <CardHeader>
          <CardTitle>Adicionar produto</CardTitle>
          <p className="text-muted-foreground text-sm">
            Os novos produtos ficam em revisão até serem aprovados pela equipa.
          </p>
        </CardHeader>
        <CardContent>
          {categories.length ? (
            <form
              action={createSellerProductAction}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Field label="Nome do produto">
                <input
                  className={inputClass}
                  name="name"
                  minLength={3}
                  maxLength={120}
                  required
                />
              </Field>
              <Field label="Categoria">
                <select
                  className={inputClass}
                  name="categoryId"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Escolher categoria
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {displayName(category.name)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marca">
                <input className={inputClass} name="brand" maxLength={100} />
              </Field>
              <Field label="Descrição">
                <input
                  className={inputClass}
                  name="description"
                  maxLength={2000}
                />
              </Field>
              <Field label="Nome da variante">
                <input
                  className={inputClass}
                  name="label"
                  placeholder="Ex.: Embalagem 1 litro"
                  required
                />
              </Field>
              <Field label="SKU">
                <input
                  className={inputClass}
                  name="sku"
                  maxLength={80}
                  required
                />
              </Field>
              <Field label="Unidade">
                <select className={inputClass} name="unit" defaultValue="UNIT">
                  {units.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tamanho da unidade">
                <input
                  className={inputClass}
                  type="number"
                  name="unitSize"
                  min="0.0001"
                  step="0.0001"
                  defaultValue="1"
                  required
                />
              </Field>
              <Field label="Preço (Mzn)">
                <input
                  className={inputClass}
                  type="number"
                  name="price"
                  min="0.01"
                  step="0.01"
                  required
                />
              </Field>
              <Field label="Stock inicial">
                <input
                  className={inputClass}
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  defaultValue="0"
                  required
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit">Enviar para revisão</Button>
              </div>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">
              Ainda não há categorias disponíveis. Peça à equipa para configurar
              o catálogo.
            </p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="products-heading">
        <div>
          <h2
            id="products-heading"
            className="font-heading text-2xl font-semibold"
          >
            Os meus produtos
          </h2>
          <p className="text-muted-foreground text-sm">
            Stock disponível e estado da revisão.
          </p>
        </div>
        {data.products.length ? (
          <div className="grid gap-4">
            {data.products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductStockThumbnail
                        image={product.images[0]}
                        productName={product.name}
                        categoryName={product.category.name}
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {displayName(product.name)}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {displayName(product.category.name)}
                        </p>
                        {product.rejectionReason && (
                          <p className="text-destructive mt-2 text-sm">
                            Motivo da rejeição:{" "}
                            {displayName(product.rejectionReason)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        product.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {productStatus[product.status]}
                    </Badge>
                  </div>
                  <div className="mt-4 divide-y">
                    {product.variants.map((variant, index) => {
                      const onHand = variant.inventory?.quantityOnHand ?? 0;
                      const reserved = variant.inventory?.quantityReserved ?? 0;
                      return (
                        <div key={variant.id} className="py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {displayName(variant.label)} ·{" "}
                                {formatPrice(variant.priceCents)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {variant.sku.toUpperCase().startsWith("DEV-")
                                  ? "SKU não definido"
                                  : `SKU ${displayName(variant.sku)}`}{" "}
                                · {onHand - reserved} disponíveis ({reserved}{" "}
                                reservadas)
                              </p>
                            </div>
                            <form
                              action={adjustSellerStockAction}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <input
                                type="hidden"
                                name="variantId"
                                value={variant.id}
                              />
                              <label
                                className="sr-only"
                                htmlFor={`stock-${variant.id}`}
                              >
                                Ajuste de stock para{" "}
                                {displayName(variant.label)}
                              </label>
                              <input
                                id={`stock-${variant.id}`}
                                className={`${inputClass} w-28`}
                                aria-label="Ajuste de stock (+ entrada, − saída)"
                                type="number"
                                name="quantity"
                                step="1"
                                required
                                placeholder="± quantidade"
                              />
                              <input
                                className={`${inputClass} w-44`}
                                name="reason"
                                maxLength={180}
                                placeholder="Motivo do ajuste"
                                aria-label="Motivo do ajuste de stock"
                              />
                              <Button type="submit" variant="outline" size="sm">
                                Ajustar stock
                              </Button>
                            </form>
                          </div>
                          {index === 0 && (
                            <details className="mt-3">
                              <summary className="text-primary cursor-pointer text-sm underline">
                                Editar dados do produto
                              </summary>
                              <form
                                action={updateSellerProductAction}
                                className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                              >
                                <input
                                  type="hidden"
                                  name="productId"
                                  value={product.id}
                                />
                                <input
                                  type="hidden"
                                  name="variantId"
                                  value={variant.id}
                                />
                                <Field label="Nome">
                                  <input
                                    className={inputClass}
                                    name="name"
                                    defaultValue={displayName(product.name)}
                                    minLength={3}
                                    maxLength={120}
                                    required
                                  />
                                </Field>
                                <Field label="Categoria">
                                  <select
                                    className={inputClass}
                                    name="categoryId"
                                    defaultValue={
                                      categories.find(
                                        (category) =>
                                          category.name ===
                                          product.category.name,
                                      )?.id ?? ""
                                    }
                                    required
                                  >
                                    {categories.map((category) => (
                                      <option
                                        key={category.id}
                                        value={category.id}
                                      >
                                        {displayName(category.name)}
                                      </option>
                                    ))}
                                  </select>
                                </Field>
                                <Field label="Marca">
                                  <input
                                    className={inputClass}
                                    name="brand"
                                    defaultValue={displayName(
                                      product.brand ?? "",
                                    )}
                                    maxLength={100}
                                  />
                                </Field>
                                <Field label="Descrição">
                                  <input
                                    className={inputClass}
                                    name="description"
                                    defaultValue={displayDescription(
                                      product.description ?? "",
                                    )}
                                    maxLength={2000}
                                  />
                                </Field>
                                <Field label="Variante">
                                  <input
                                    className={inputClass}
                                    name="label"
                                    defaultValue={displayName(variant.label)}
                                    required
                                  />
                                </Field>
                                <Field label="Preço (Mzn)">
                                  <input
                                    className={inputClass}
                                    name="price"
                                    type="number"
                                    defaultValue={(
                                      variant.priceCents / 100
                                    ).toFixed(2)}
                                    min="0.01"
                                    step="0.01"
                                    required
                                  />
                                </Field>
                                <div className="flex items-end">
                                  <Button type="submit" variant="outline">
                                    Guardar e reenviar para revisão
                                  </Button>
                                </div>
                              </form>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              Ainda não adicionou produtos.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="orders-heading">
        <div>
          <h2
            id="orders-heading"
            className="font-heading text-2xl font-semibold"
          >
            Encomendas recebidas
          </h2>
          <p className="text-muted-foreground text-sm">
            As encomendas são separadas por vendedor. Só pode alterar as suas.
          </p>
        </div>
        {data.orders.length ? (
          <div className="grid gap-4">
            {data.orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{order.order.number}</h3>
                      <p className="text-muted-foreground text-sm">
                        {new Intl.DateTimeFormat("pt-MZ", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(order.createdAt)}{" "}
                        · {order.order.contactPhone}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {orderStatus[order.status]}
                    </Badge>
                  </div>
                  <ul className="my-4 space-y-1 text-sm">
                    {order.items.map((item, index) => (
                      <li key={`${item.productName}-${index}`}>
                        {item.quantity} × {displayName(item.productName)} (
                        {item.variantLabel}) —{" "}
                        {formatPrice(item.lineTotalCents)}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    Subtotal {formatPrice(order.subtotalCents)} · líquido
                    previsto {formatPrice(order.sellerNetCents)}
                  </p>
                  {order.status === "PENDING" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={updateSellerOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="next" value="CONFIRMED" />
                        <Button type="submit">Confirmar encomenda</Button>
                      </form>
                      <form
                        action={updateSellerOrderAction}
                        className="flex gap-2"
                      >
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="next" value="REJECTED" />
                        <input
                          className={`${inputClass} w-52`}
                          name="reason"
                          maxLength={240}
                          placeholder="Motivo da recusa"
                          aria-label="Motivo da recusa"
                        />
                        <Button type="submit" variant="outline">
                          Recusar
                        </Button>
                      </form>
                    </div>
                  )}
                  {order.status === "CONFIRMED" && (
                    <form action={updateSellerOrderAction} className="mt-4">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input
                        type="hidden"
                        name="next"
                        value="READY_FOR_PICKUP"
                      />
                      <Button type="submit" variant="outline">
                        Marcar pronta para recolha
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-sm">
              Ainda não recebeu encomendas.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="font-heading mt-2 text-2xl font-semibold">{value}</p>
        <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
import type { ReactNode } from "react";
