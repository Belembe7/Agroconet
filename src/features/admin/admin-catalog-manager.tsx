"use client";

import Image from "next/image";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Eye,
  Image as ImageIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ActionFeedbackForm } from "@/components/shared/action-feedback-form";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { displayName } from "@/lib/display-name";
import {
  createCatalogProductAction,
  createCategoryAction,
  removeCatalogProductAction,
  reviewProductAction,
  setCatalogProductFeaturedAction,
  setCategoryActiveAction,
  updateCatalogProductAction,
  updateCatalogVariantAction,
} from "@/features/admin/actions";
import type { AdminCatalogManagementData } from "@/services/admin/admin-service";

const PAGE_SIZE = 12;
const inputClass =
  "border-input bg-background min-h-10 w-full rounded-lg border px-3 text-sm";

const units = [
  ["UNIT", "Unidade"],
  ["KG", "kg"],
  ["G", "g"],
  ["L", "L"],
  ["ML", "ml"],
  ["BAG", "Saco"],
  ["BOX", "Caixa"],
] as const;

const productStatuses = [
  ["ACTIVE", "Publicado"],
  ["DRAFT", "Rascunho"],
  ["PENDING_REVIEW", "Pendente"],
  ["REJECTED", "Rejeitado"],
  ["INACTIVE", "Inativo"],
  ["ARCHIVED", "Arquivado"],
] as const;

type Product = AdminCatalogManagementData["products"][number];
type Section = "products" | "pending" | "categories";
type ProductPanel =
  { mode: "create" } | { mode: "edit" | "view"; productId: string } | null;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function safeImageUrl(storageKey: string) {
  if (storageKey.startsWith("/") && !storageKey.startsWith("//"))
    return storageKey;
  if (
    storageKey.length <= 2_100_000 &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      storageKey,
    )
  )
    return storageKey;
  try {
    const url = new URL(storageKey);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function ProductStatusSelect({
  name = "status",
  defaultValue,
}: {
  name?: string;
  defaultValue: string;
}) {
  return (
    <select className={inputClass} name={name} defaultValue={defaultValue}>
      {productStatuses.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function productStatusLabel(status: string) {
  return productStatuses.find(([value]) => value === status)?.[1] ?? status;
}

function statusTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING_REVIEW") return "warning";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

function defaultVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.isDefault) ?? product.variants[0]
  );
}

function productRevisionKey(product: Product) {
  return [
    product.id,
    product.name,
    product.description,
    product.brand,
    product.categoryId,
    product.status,
    product.isFeatured,
    ...product.images.map(
      (image) => `${image.id}:${image.alt}:${image.isPrimary}`,
    ),
    ...product.variants.map((variant) =>
      [
        variant.id,
        variant.label,
        variant.sku,
        variant.unit,
        variant.unitSize,
        variant.priceCents,
        variant.compareAtPriceCents,
        variant.inventory?.quantityOnHand,
      ].join(":"),
    ),
  ].join("|");
}

function ProductFormFields({
  categories,
  sellers,
  selectedCategoryId,
}: {
  categories: AdminCatalogManagementData["categories"];
  sellers: AdminCatalogManagementData["sellers"];
  selectedCategoryId: string | null;
}) {
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId && category.isActive,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
          defaultValue={selectedCategory?.id ?? ""}
          required
        >
          <option value="" disabled>
            Escolher categoria
          </option>
          {categories
            .filter((category) => category.isActive)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {displayName(category.name)}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Vendedor aprovado">
        <select className={inputClass} name="sellerId" defaultValue="" required>
          <option value="" disabled>
            Escolher vendedor
          </option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {displayName(seller.businessName)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Marca (opcional)">
        <input className={inputClass} name="brand" maxLength={100} />
      </Field>
      <Field label="Descrição">
        <Textarea name="description" maxLength={2000} />
      </Field>
      <Field label="Estado inicial">
        <ProductStatusSelect defaultValue="ACTIVE" />
      </Field>
      <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
        <input
          className="accent-primary size-4"
          type="checkbox"
          name="isFeatured"
        />
        Promover para destaque na página inicial
      </label>
      <div className="sm:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">Primeira opção de compra</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Opção / embalagem">
            <input
              className={inputClass}
              name="label"
              placeholder="Ex.: Saco de 5 kg"
              maxLength={120}
              required
            />
          </Field>
          <Field label="SKU">
            <input
              className={inputClass}
              name="sku"
              placeholder="Ex.: ADUBO-25KG"
              maxLength={80}
              required
            />
          </Field>
          <Field label="Unidade">
            <select className={inputClass} name="unit" defaultValue="UNIT">
              {units.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tamanho da unidade">
            <NumericInput
              className={inputClass}
              name="unitSize"
              min="0.0001"
              step="0.0001"
              defaultValue="1"
              required
            />
          </Field>
          <Field label="Preço normal (MZN)">
            <NumericInput
              className={inputClass}
              name="normalPrice"
              min="0.01"
              step="0.01"
              required
            />
          </Field>
          <Field label="Preço promocional (opcional, MZN)">
            <NumericInput
              className={inputClass}
              name="promoPrice"
              min="0"
              step="0.01"
            />
          </Field>
          <Field label="Stock inicial">
            <NumericInput
              className={inputClass}
              name="stock"
              min="0"
              step="1"
              defaultValue="0"
              required
            />
          </Field>
          <Field label="Fotos do produto (PNG, JPEG ou WebP)">
            <input
              className={`${inputClass} py-2`}
              name="images"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
            />
            <span className="text-muted-foreground text-xs font-normal">
              Até 4 fotos, 1,5 MB cada e 3 MB no total.
            </span>
          </Field>
        </div>
      </div>
    </div>
  );
}

function ProductVariantForms({ product }: { product: Product }) {
  return (
    <section className="space-y-3 border-t pt-5">
      <div>
        <h3 className="font-semibold">Preços, promoções e stock</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          O stock reservado não pode ser reduzido abaixo da quantidade
          reservada.
        </p>
      </div>
      {product.variants.map((variant) => (
        <ActionFeedbackForm
          key={variant.id}
          action={updateCatalogVariantAction}
          className="bg-muted/40 grid gap-3 rounded-xl p-4 sm:grid-cols-2"
          successMessage="Preço, promoção e stock actualizados."
          errorMessage="Não foi possível actualizar esta variante. Confirme a promoção e o stock reservado."
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="variantId" value={variant.id} />
          <Field label="Opção / embalagem">
            <input
              className={inputClass}
              name="label"
              defaultValue={displayName(variant.label)}
              maxLength={120}
              required
            />
          </Field>
          <Field label="SKU">
            <input
              className={inputClass}
              name="sku"
              defaultValue={variant.sku}
              maxLength={80}
              required
            />
          </Field>
          <Field label="Unidade">
            <select
              className={inputClass}
              name="unit"
              defaultValue={variant.unit}
            >
              {units.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tamanho da unidade">
            <NumericInput
              className={inputClass}
              name="unitSize"
              min="0.0001"
              step="0.0001"
              defaultValue={String(variant.unitSize)}
              required
            />
          </Field>
          <Field label="Preço normal (MZN)">
            <NumericInput
              className={inputClass}
              name="normalPrice"
              min="0.01"
              step="0.01"
              defaultValue={(
                (variant.compareAtPriceCents ?? variant.priceCents) / 100
              ).toFixed(2)}
              required
            />
          </Field>
          <Field label="Preço promocional (opcional, MZN)">
            <NumericInput
              className={inputClass}
              name="promoPrice"
              min="0"
              step="0.01"
              defaultValue={
                variant.compareAtPriceCents
                  ? (variant.priceCents / 100).toFixed(2)
                  : ""
              }
            />
          </Field>
          <Field label="Stock total">
            <NumericInput
              className={inputClass}
              name="stock"
              min="0"
              step="1"
              defaultValue={String(variant.inventory?.quantityOnHand ?? 0)}
              required
            />
            <span className="text-muted-foreground text-xs font-normal">
              {variant.inventory?.quantityReserved ?? 0} reservado(s)
            </span>
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="outline">
              Guardar variante
            </Button>
          </div>
          {variant.compareAtPriceCents ? (
            <p className="text-primary text-sm sm:col-span-2">
              Promoção activa: {formatPrice(variant.priceCents)} em vez de{" "}
              {formatPrice(variant.compareAtPriceCents)}.
            </p>
          ) : null}
        </ActionFeedbackForm>
      ))}
      {!product.variants.length ? (
        <p className="text-muted-foreground rounded-xl border p-4 text-sm">
          Este produto ainda não tem opções de compra.
        </p>
      ) : null}
    </section>
  );
}

function ProductImagePreview({ product }: { product: Product }) {
  const image = product.images[0];
  const url = safeImageUrl(image?.url ?? "");
  return (
    <span className="bg-muted relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
      {url ? (
        <Image
          src={url}
          alt={image?.alt || displayName(product.name)}
          fill
          sizes="56px"
          unoptimized
          className="object-contain"
        />
      ) : (
        <ImageIcon
          aria-hidden="true"
          className="text-muted-foreground size-5"
        />
      )}
    </span>
  );
}

function ProductActions({
  onView,
  onEdit,
  onRemove,
}: {
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-sky-700 hover:bg-sky-50 hover:text-sky-800"
        aria-label="Ver produto"
        title="Ver produto"
        onClick={onView}
      >
        <Eye aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-sky-700 hover:bg-sky-50 hover:text-sky-800"
        aria-label="Editar produto"
        title="Editar produto"
        onClick={onEdit}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10"
        aria-label="Remover produto"
        title="Remover produto"
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

function FeaturedToggle({ product }: { product: Product }) {
  const shouldFeature = !product.isFeatured;
  return (
    <ActionFeedbackForm
      action={setCatalogProductFeaturedAction}
      className="inline-flex"
      successMessage={
        shouldFeature
          ? "Produto promovido para destaque."
          : "Destaque removido do produto."
      }
      errorMessage="Não foi possível alterar o destaque do produto."
    >
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="featured" value={String(shouldFeature)} />
      <Button
        type="submit"
        size="icon-sm"
        variant="ghost"
        className={
          product.isFeatured
            ? "text-amber-600 hover:bg-amber-50"
            : "text-muted-foreground hover:bg-muted"
        }
        aria-label={
          product.isFeatured
            ? "Remover dos destaques"
            : "Promover para destaque"
        }
        title={
          product.isFeatured ? "Remover dos destaques" : "Destacar produto"
        }
      >
        <Star
          aria-hidden="true"
          className={product.isFeatured ? "fill-current" : ""}
        />
      </Button>
    </ActionFeedbackForm>
  );
}

export function AdminCatalogManager({
  products,
  categories,
  sellers,
  initialSection = "products",
}: AdminCatalogManagementData & { initialSection?: Section }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>(initialSection);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [productPanel, setProductPanel] = useState<ProductPanel>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [deleting, startDelete] = useTransition();

  const pendingProducts = products.filter(
    (product) => product.status === "PENDING_REVIEW",
  );
  const selectedProduct =
    productPanel && productPanel.mode !== "create"
      ? (products.find((product) => product.id === productPanel.productId) ??
        null)
      : null;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-MZ");
    return products.filter((product) => {
      if (section === "pending" && product.status !== "PENDING_REVIEW")
        return false;
      if (selectedCategoryId && product.categoryId !== selectedCategoryId)
        return false;
      if (
        section === "products" &&
        statusFilter !== "ALL" &&
        product.status !== statusFilter
      )
        return false;
      if (!query) return true;
      return [
        product.name,
        product.brand ?? "",
        product.category.name,
        product.seller.businessName,
        ...product.variants.map((variant) => variant.sku),
      ]
        .join(" ")
        .toLocaleLowerCase("pt-MZ")
        .includes(query);
    });
  }, [products, search, section, selectedCategoryId, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const activeCategories = categories.filter((category) => category.isActive);
  const createAvailable = activeCategories.length > 0 && sellers.length > 0;

  function changeSection(value: string | null) {
    if (value === "products" || value === "pending" || value === "categories") {
      setSection(value);
      setCurrentPage(1);
      setSearch("");
      setSelectedCategoryId(null);
    }
  }

  function changeCategory(categoryId: string | null) {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  }

  function removeProduct() {
    if (!deleteCandidate) return;
    const product = deleteCandidate;
    startDelete(async () => {
      try {
        await removeCatalogProductAction(product.id);
        toast.success("Produto removido do catálogo.");
        setDeleteCandidate(null);
        if (selectedProduct?.id === product.id) setProductPanel(null);
        router.refresh();
      } catch {
        toast.error(
          "Não foi possível remover o produto. Atualize a página e tente novamente.",
        );
      }
    });
  }

  function categorySelector() {
    return (
      <fieldset className="grid gap-2">
        <legend className="text-muted-foreground text-sm font-medium">
          Filtrar por categoria
        </legend>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selectedCategoryId === null ? "default" : "outline"}
            aria-pressed={selectedCategoryId === null}
            onClick={() => changeCategory(null)}
          >
            Todos <span className="opacity-75">{products.length}</span>
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={
                selectedCategoryId === category.id ? "default" : "outline"
              }
              aria-pressed={selectedCategoryId === category.id}
              onClick={() => changeCategory(category.id)}
            >
              {displayName(category.name)}{" "}
              <span className="opacity-75">
                {
                  products.filter(
                    (product) => product.categoryId === category.id,
                  ).length
                }
              </span>
            </Button>
          ))}
        </div>
      </fieldset>
    );
  }

  function productTable(items: Product[]) {
    return (
      <>
        <div className="hidden overflow-hidden rounded-2xl border md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground text-xs tracking-wide uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Produto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Categoria
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Preço
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((product) => {
                  const variant = defaultVariant(product);
                  return (
                    <tr key={product.id} className="hover:bg-muted/25">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductImagePreview product={product} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {displayName(product.name)}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {displayName(product.seller.businessName)}
                              {product.brand
                                ? ` · ${displayName(product.brand)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {displayName(product.category.name)}
                      </td>
                      <td className="px-4 py-3">
                        {variant ? (
                          <div>
                            <p className="font-medium">
                              {formatPrice(variant.priceCents)}
                            </p>
                            {variant.compareAtPriceCents ? (
                              <p className="text-muted-foreground text-xs line-through">
                                {formatPrice(variant.compareAtPriceCents)}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {variant?.inventory?.quantityOnHand ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={statusTone(product.status)}>
                          {productStatusLabel(product.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <FeaturedToggle product={product} />
                          <ProductActions
                            onView={() =>
                              setProductPanel({
                                mode: "view",
                                productId: product.id,
                              })
                            }
                            onEdit={() =>
                              setProductPanel({
                                mode: "edit",
                                productId: product.id,
                              })
                            }
                            onRemove={() => setDeleteCandidate(product)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <ul className="grid gap-3 md:hidden">
          {items.map((product) => {
            const variant = defaultVariant(product);
            return (
              <li
                key={product.id}
                className="bg-card grid gap-3 rounded-2xl border p-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <ProductImagePreview product={product} />
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug font-semibold">
                      {displayName(product.name)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {displayName(product.category.name)} ·{" "}
                      {displayName(product.seller.businessName)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge tone={statusTone(product.status)}>
                        {productStatusLabel(product.status)}
                      </StatusBadge>
                      <span className="text-muted-foreground text-xs">
                        Stock: {variant?.inventory?.quantityOnHand ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  <div className="text-sm font-semibold">
                    {variant ? formatPrice(variant.priceCents) : "Sem preço"}
                    {variant?.compareAtPriceCents ? (
                      <span className="text-muted-foreground ml-2 text-xs font-normal line-through">
                        {formatPrice(variant.compareAtPriceCents)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <FeaturedToggle product={product} />
                    <ProductActions
                      onView={() =>
                        setProductPanel({ mode: "view", productId: product.id })
                      }
                      onEdit={() =>
                        setProductPanel({ mode: "edit", productId: product.id })
                      }
                      onRemove={() => setDeleteCandidate(product)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {!items.length ? (
          <div className="bg-muted/30 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center">
            <Package
              aria-hidden="true"
              className="text-muted-foreground mb-2 size-6"
            />
            <p className="font-medium">
              {products.length
                ? "Nenhum produto encontrado"
                : "Ainda não há produtos no catálogo"}
            </p>
            <p className="text-muted-foreground mt-1 max-w-md text-sm">
              Ajuste a pesquisa ou os filtros para ver os produtos
              correspondentes.
            </p>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <section id="catalogo-admin" className="space-y-6">
      <header className="bg-card flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
            Catálogo Agroconet
          </p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
            Gestão de produtos
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Organize o catálogo por categoria, ajuste preços e stock, e trate os
            pedidos de revisão.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setProductPanel({ mode: "create" })}
        >
          <Plus aria-hidden="true" /> Adicionar produto
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <article className="bg-card flex items-center gap-3 rounded-2xl border p-4">
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <Package aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-muted-foreground text-xs">
              Produtos no catálogo
            </p>
            <p className="mt-1 text-xl font-semibold">{products.length}</p>
          </div>
        </article>
        <article className="bg-card flex items-center gap-3 rounded-2xl border p-4">
          <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
            <AlertTriangle aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-muted-foreground text-xs">
              Pendentes de revisão
            </p>
            <p className="mt-1 text-xl font-semibold">
              {pendingProducts.length}
            </p>
          </div>
        </article>
        <article className="bg-card col-span-2 flex items-center gap-3 rounded-2xl border p-4 lg:col-span-1">
          <span className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-xl">
            <Tag aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-muted-foreground text-xs">Categorias</p>
            <p className="mt-1 text-xl font-semibold">{categories.length}</p>
          </div>
        </article>
      </div>

      <Tabs value={section} onValueChange={changeSection} className="gap-5">
        <TabsList
          aria-label="Áreas de gestão do catálogo"
          className="grid h-auto w-full grid-cols-3 p-1"
        >
          <TabsTrigger value="products" className="min-h-10">
            Produtos
          </TabsTrigger>
          <TabsTrigger value="pending" className="min-h-10">
            Pendentes{" "}
            <span className="bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 text-xs">
              {pendingProducts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="min-h-10">
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-5">
          {categorySelector()}
          <div className="bg-card flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-end sm:p-4">
            <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-medium">
              <span>Pesquisar</span>
              <span className="relative">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <input
                  className={`${inputClass} pl-9`}
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Nome, marca, vendedor ou SKU"
                />
              </span>
            </label>
            <label className="grid gap-1.5 text-sm font-medium sm:w-52">
              <span>Estado</span>
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Todos os estados</option>
                {productStatuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {productTable(pageProducts)}
          {filteredProducts.length > PAGE_SIZE ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                A mostrar {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} de{" "}
                {filteredProducts.length} produtos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                >
                  <ArrowLeft aria-hidden="true" /> Anterior
                </Button>
                <span className="text-muted-foreground px-2 text-sm">
                  {currentPage} / {pageCount}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= pageCount}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(pageCount, page + 1))
                  }
                >
                  Seguinte <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="pending" className="space-y-5">
          {categorySelector()}
          <div className="bg-card rounded-2xl border p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Produtos por analisar</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Aprova os produtos conformes ou rejeita com o motivo da decisão.
              </p>
            </div>
            {filteredProducts.length ? (
              <ul className="divide-y">
                {filteredProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductImagePreview product={product} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {displayName(product.name)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {displayName(product.seller.businessName)} ·{" "}
                          {displayName(product.category.name)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:min-w-[22rem] sm:flex-row">
                      <ActionFeedbackForm
                        action={reviewProductAction}
                        className="flex gap-2"
                        successMessage="Produto aprovado."
                        errorMessage="Não foi possível aprovar o produto. Atualize a página e tente novamente."
                        onSuccess={() => router.refresh()}
                      >
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <Button size="sm" className="w-full sm:w-auto">
                          Aprovar
                        </Button>
                      </ActionFeedbackForm>
                      <ActionFeedbackForm
                        action={reviewProductAction}
                        className="flex min-w-0 flex-1 gap-2"
                        successMessage="Decisão sobre o produto guardada."
                        errorMessage="Não foi possível rejeitar o produto. Atualize a página e tente novamente."
                        onSuccess={() => router.refresh()}
                      >
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <input
                          className={inputClass}
                          name="reason"
                          placeholder="Motivo da rejeição"
                          maxLength={500}
                          aria-label={`Motivo da rejeição de ${displayName(product.name)}`}
                          required
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
              <div className="bg-muted/30 flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center">
                <p className="font-medium">
                  Não há produtos pendentes nesta categoria
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Os novos produtos enviados para revisão aparecem aqui.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-5">
          <section className="bg-card space-y-4 rounded-2xl border p-4 sm:p-5">
            <header>
              <h3 className="font-semibold">Categorias de produtos</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Cria categorias e controla quais aparecem como opções na loja.
              </p>
            </header>
            <ActionFeedbackForm
              action={createCategoryAction}
              className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]"
              successMessage="Categoria criada."
              errorMessage="Não foi possível criar a categoria. Verifique os campos e tente novamente."
              onSuccess={() => router.refresh()}
            >
              <Field label="Nome da nova categoria">
                <input
                  className={inputClass}
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </Field>
              <Field label="Descrição (opcional)">
                <input
                  className={inputClass}
                  name="description"
                  maxLength={500}
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" className="w-full sm:w-auto">
                  <Plus aria-hidden="true" /> Criar categoria
                </Button>
              </div>
            </ActionFeedbackForm>
            {categories.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const count = products.filter(
                    (product) => product.categoryId === category.id,
                  ).length;
                  return (
                    <li
                      key={category.id}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {displayName(category.name)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {count} produto(s) ·{" "}
                          {category.requiresReview
                            ? "Exige revisão"
                            : "Revisão normal"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge
                          tone={category.isActive ? "success" : "neutral"}
                        >
                          {category.isActive ? "Activa" : "Inactiva"}
                        </StatusBadge>
                        <ActionFeedbackForm
                          action={setCategoryActiveAction}
                          className="shrink-0"
                          successMessage="Estado da categoria actualizado."
                          errorMessage="Não foi possível actualizar a categoria. Actualize a página e tente novamente."
                          onSuccess={() => router.refresh()}
                        >
                          <input type="hidden" name="id" value={category.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={String(!category.isActive)}
                          />
                          <Button
                            size="sm"
                            variant={category.isActive ? "outline" : "default"}
                          >
                            {category.isActive ? "Desactivar" : "Activar"}
                          </Button>
                        </ActionFeedbackForm>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground rounded-xl border border-dashed p-5 text-sm">
                Ainda não há categorias configuradas.
              </p>
            )}
          </section>
        </TabsContent>
      </Tabs>

      <Sheet
        open={productPanel !== null}
        onOpenChange={(open) => {
          if (!open) setProductPanel(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full max-w-full overflow-y-auto p-0 sm:max-w-3xl"
        >
          {productPanel?.mode === "create" ? (
            <>
              <SheetHeader className="border-b p-5 sm:p-6">
                <SheetTitle>Adicionar produto</SheetTitle>
                <SheetDescription>
                  Escolhe um vendedor aprovado, define uma categoria activa e
                  preenche a primeira opção de compra.
                </SheetDescription>
              </SheetHeader>
              {createAvailable ? (
                <ActionFeedbackForm
                  action={createCatalogProductAction}
                  className="grid gap-5 p-5 sm:p-6"
                  successMessage="Produto adicionado ao catálogo."
                  errorMessage="Não foi possível adicionar o produto. Confirme vendedor, categoria, preços e fotos."
                  onSuccess={() => setProductPanel(null)}
                >
                  <ProductFormFields
                    categories={categories}
                    sellers={sellers}
                    selectedCategoryId={selectedCategoryId}
                  />
                  <SheetFooter className="border-t p-0 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setProductPanel(null)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Plus aria-hidden="true" /> Adicionar produto
                    </Button>
                  </SheetFooter>
                </ActionFeedbackForm>
              ) : activeCategories.length === 0 ? (
                <div className="p-5 sm:p-6">
                  <div
                    role="status"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
                  >
                    Active uma categoria antes de adicionar um produto.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setProductPanel(null);
                      setSection("categories");
                    }}
                  >
                    Gerir categorias
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-5 sm:p-6">
                  <div
                    role="status"
                    className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
                  >
                    <p className="font-semibold">
                      Não há vendedores aprovados disponíveis para associar ao
                      produto.
                    </p>
                    <p className="mt-1">
                      O catálogo aceita apenas vendedores reais aprovados;
                      contas de demonstração ou desenvolvimento ficam excluídas.
                    </p>
                  </div>
                  <Link
                    href="/admin#vendedores-pendentes"
                    className="text-primary inline-flex min-h-10 items-center font-medium underline underline-offset-4"
                    onClick={() => setProductPanel(null)}
                  >
                    Ver aprovações de vendedores
                  </Link>
                </div>
              )}
            </>
          ) : selectedProduct && productPanel?.mode === "edit" ? (
            <>
              <SheetHeader className="border-b p-5 sm:p-6">
                <SheetTitle>Editar produto</SheetTitle>
                <SheetDescription>
                  {displayName(selectedProduct.name)} ·{" "}
                  {displayName(selectedProduct.seller.businessName)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 p-5 sm:p-6">
                <ActionFeedbackForm
                  key={productRevisionKey(selectedProduct)}
                  action={updateCatalogProductAction}
                  className="grid gap-4 sm:grid-cols-2"
                  successMessage="Dados do produto actualizados."
                  errorMessage="Não foi possível guardar o produto. Verifique os dados e as fotos."
                  onSuccess={() => setProductPanel(null)}
                >
                  <input
                    type="hidden"
                    name="productId"
                    value={selectedProduct.id}
                  />
                  <Field label="Nome">
                    <input
                      className={inputClass}
                      name="name"
                      defaultValue={displayName(selectedProduct.name)}
                      minLength={3}
                      maxLength={120}
                      required
                    />
                  </Field>
                  <Field label="Categoria">
                    <select
                      className={inputClass}
                      name="categoryId"
                      defaultValue={selectedProduct.categoryId}
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {displayName(category.name)}
                          {category.isActive ? "" : " (inactiva)"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Estado">
                    <ProductStatusSelect
                      defaultValue={selectedProduct.status}
                    />
                  </Field>
                  <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
                    <input
                      className="accent-primary size-4"
                      type="checkbox"
                      name="isFeatured"
                      defaultChecked={selectedProduct.isFeatured}
                    />
                    Mostrar como destaque na página inicial
                  </label>
                  <Field label="Marca">
                    <input
                      className={inputClass}
                      name="brand"
                      defaultValue={displayName(selectedProduct.brand ?? "")}
                      maxLength={100}
                    />
                  </Field>
                  <Field label="Descrição">
                    <Textarea
                      name="description"
                      defaultValue={selectedProduct.description ?? ""}
                      maxLength={2000}
                    />
                  </Field>
                  <div className="text-muted-foreground self-end text-sm">
                    Vendedor: {displayName(selectedProduct.seller.businessName)}
                  </div>
                  {selectedProduct.images.length ? (
                    <div className="grid gap-2 sm:col-span-2">
                      <span className="text-sm font-medium">Fotos actuais</span>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.images.map((image) => {
                          const url = safeImageUrl(image.url ?? "");
                          return (
                            <label
                              key={image.id}
                              className="grid w-28 gap-1.5 text-xs"
                            >
                              <span className="bg-muted relative aspect-square overflow-hidden rounded-xl border">
                                {url ? (
                                  <Image
                                    src={url}
                                    alt={
                                      image.alt ||
                                      displayName(selectedProduct.name)
                                    }
                                    fill
                                    sizes="112px"
                                    unoptimized
                                    className="object-contain"
                                  />
                                ) : null}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  name="removeImageId"
                                  value={image.id}
                                />{" "}
                                Remover foto
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <Field label="Adicionar fotos (PNG, JPEG ou WebP)">
                    <input
                      className={`${inputClass} py-2`}
                      name="images"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                    />
                    <span className="text-muted-foreground text-xs font-normal">
                      Até 4 fotos, 1,5 MB cada e 3 MB no total.
                    </span>
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full sm:w-auto">
                      Guardar produto
                    </Button>
                  </div>
                </ActionFeedbackForm>
                <ProductVariantForms
                  key={`${selectedProduct.id}:${selectedProduct.variants.map((variant) => variant.id).join(":")}`}
                  product={selectedProduct}
                />
              </div>
            </>
          ) : selectedProduct && productPanel?.mode === "view" ? (
            <>
              <SheetHeader className="border-b p-5 sm:p-6">
                <SheetTitle>Detalhes do produto</SheetTitle>
                <SheetDescription>
                  {displayName(selectedProduct.category.name)} ·{" "}
                  {displayName(selectedProduct.seller.businessName)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {displayName(selectedProduct.name)}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {selectedProduct.brand
                        ? displayName(selectedProduct.brand)
                        : "Sem marca"}
                    </p>
                  </div>
                  <StatusBadge tone={statusTone(selectedProduct.status)}>
                    {productStatusLabel(selectedProduct.status)}
                  </StatusBadge>
                </div>
                {selectedProduct.images.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedProduct.images.map((image) => {
                      const url = safeImageUrl(image.url ?? "");
                      return (
                        <div
                          key={image.id}
                          className="bg-muted relative aspect-square overflow-hidden rounded-xl border"
                        >
                          {url ? (
                            <Image
                              src={url}
                              alt={
                                image.alt || displayName(selectedProduct.name)
                              }
                              fill
                              sizes="(max-width: 640px) 50vw, 220px"
                              unoptimized
                              className="object-contain"
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-muted text-muted-foreground flex aspect-[3/1] items-center justify-center rounded-xl border">
                    <ImageIcon aria-hidden="true" className="size-7" />
                  </div>
                )}
                <section className="space-y-2">
                  <h4 className="font-semibold">Descrição</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {selectedProduct.description || "Sem descrição."}
                  </p>
                </section>
                <section className="space-y-3">
                  <h4 className="font-semibold">Opções de compra</h4>
                  {selectedProduct.variants.map((variant) => (
                    <article
                      key={variant.id}
                      className="grid gap-2 rounded-xl border p-4 sm:grid-cols-2"
                    >
                      <div>
                        <p className="font-medium">
                          {displayName(variant.label)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          SKU {variant.sku} · {variant.unitSize} {variant.unit}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-semibold">
                          {formatPrice(variant.priceCents)}
                          {variant.compareAtPriceCents ? (
                            <span className="text-muted-foreground ml-2 text-xs font-normal line-through">
                              {formatPrice(variant.compareAtPriceCents)}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Stock {variant.inventory?.quantityOnHand ?? 0} ·{" "}
                          {variant.inventory?.quantityReserved ?? 0}{" "}
                          reservado(s)
                        </p>
                      </div>
                    </article>
                  ))}
                </section>
                <SheetFooter className="border-t p-0 pt-4 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteCandidate(selectedProduct)}
                  >
                    <Trash2 aria-hidden="true" /> Remover do catálogo
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setProductPanel({
                        mode: "edit",
                        productId: selectedProduct.id,
                      })
                    }
                  >
                    <Pencil aria-hidden="true" /> Editar produto
                  </Button>
                </SheetFooter>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteCandidate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto do catálogo?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate ? (
                <>
                  <strong>{displayName(deleteCandidate.name)}</strong> deixará
                  de aparecer na loja. O registo e o histórico relacionado serão
                  preservados.
                </>
              ) : (
                "O produto deixará de aparecer na loja."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting || !deleteCandidate}
              onClick={removeProduct}
            >
              <Trash2 aria-hidden="true" />{" "}
              {deleting ? "A remover…" : "Confirmar remoção"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
