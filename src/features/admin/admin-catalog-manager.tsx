"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { ActionFeedbackForm } from "@/components/shared/action-feedback-form";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { displayName } from "@/lib/display-name";
import {
  createCatalogProductAction,
  createCategoryAction,
  reviewProductAction,
  setCategoryActiveAction,
  updateCatalogProductAction,
  updateCatalogVariantAction,
} from "@/features/admin/actions";
import type { AdminCatalogManagementData } from "@/services/admin/admin-service";

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
  ["PENDING_REVIEW", "Em revisão"],
  ["REJECTED", "Rejeitado"],
  ["INACTIVE", "Inativo"],
  ["ARCHIVED", "Arquivado"],
] as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
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

export function AdminCatalogManager({
  products,
  categories,
  sellers,
}: AdminCatalogManagementData) {
  const [search, setSearch] = useState("");
  const pendingProducts = products.filter(
    (product) => product.status === "PENDING_REVIEW",
  );
  const estimatedProducts = products.filter((product) =>
    product.description?.startsWith("Dados estimados:"),
  );
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-MZ");
    if (!query) return products;
    return products.filter((product) =>
      [
        product.name,
        product.brand ?? "",
        product.category.name,
        product.seller.businessName,
        ...product.variants.map((variant) => variant.sku),
      ]
        .join(" ")
        .toLocaleLowerCase("pt-MZ")
        .includes(query),
    );
  }, [products, search]);

  return (
    <section
      id="catalogo-admin"
      className="bg-card space-y-5 rounded-2xl border p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Catálogo público</p>
          <h2 className="text-xl font-semibold">Produtos e promoções</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie, edite, publique, ajuste stock e envie as fotos que aparecem na
            loja.
          </p>
          {estimatedProducts.length ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {estimatedProducts.length} produtos com valores estimados estão
              disponíveis para actualizar aqui.
            </p>
          ) : null}
        </div>
        <span className="text-muted-foreground text-sm">
          {products.length} produtos
        </span>
      </div>

      <section className="rounded-xl border p-4">
        <h3 className="font-semibold">
          Produtos por analisar ({pendingProducts.length})
        </h3>
        {pendingProducts.length ? (
          <ul className="mt-2 divide-y">
            {pendingProducts.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{displayName(product.name)}</p>
                  <p className="text-muted-foreground text-sm">
                    {displayName(product.seller.businessName)} ·{" "}
                    {displayName(product.category.name)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionFeedbackForm
                    action={reviewProductAction}
                    successMessage="Produto aprovado."
                    errorMessage="Não foi possível aprovar o produto. Atualize a página e tente novamente."
                  >
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <Button size="sm">Aprovar</Button>
                  </ActionFeedbackForm>
                  <ActionFeedbackForm
                    action={reviewProductAction}
                    className="flex gap-2"
                    successMessage="Decisão sobre o produto guardada."
                    errorMessage="Não foi possível rejeitar o produto. Atualize a página e tente novamente."
                  >
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <input
                      className={inputClass}
                      name="reason"
                      placeholder="Motivo da rejeição"
                      maxLength={500}
                      aria-label="Motivo da rejeição"
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
          <p className="text-muted-foreground mt-2 text-sm">
            Sem produtos pendentes de análise.
          </p>
        )}
      </section>

      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer font-semibold">
          Adicionar produto ao catálogo
        </summary>
        <p className="text-muted-foreground mt-2 text-sm">
          Escolha o vendedor e a categoria. Uma promoção é opcional e precisa
          ser menor que o preço normal.
        </p>
        {categories.some((category) => category.isActive) && sellers.length ? (
          <ActionFeedbackForm
            action={createCatalogProductAction}
            className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            successMessage="Produto adicionado ao catálogo."
            errorMessage="Não foi possível adicionar o produto. Confirme vendedor, categoria, preços e fotos."
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
                defaultValue=""
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
              <select
                className={inputClass}
                name="sellerId"
                defaultValue=""
                required
              >
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
                Até 4 fotos por envio, 1,5 MB cada e 3 MB no total.
              </span>
            </Field>
            <div className="flex items-end">
              <Button type="submit">Adicionar produto</Button>
            </div>
          </ActionFeedbackForm>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">
            Para adicionar produtos, active pelo menos uma categoria e aprove um
            vendedor.
          </p>
        )}
      </details>

      <label className="grid max-w-xl gap-1.5 text-sm font-medium">
        <span>Pesquisar produtos</span>
        <input
          className={inputClass}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome, marca, categoria, vendedor ou SKU"
        />
      </label>

      <div className="space-y-3">
        {filteredProducts.map((product) => (
          <details key={product.id} className="rounded-xl border p-4">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                {product.images[0] &&
                safeImageUrl(product.images[0].url ?? "") ? (
                  <span className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg border">
                    <Image
                      src={safeImageUrl(product.images[0].url ?? "")!}
                      alt={product.images[0].alt || displayName(product.name)}
                      fill
                      sizes="56px"
                      unoptimized
                      className="object-contain"
                    />
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {displayName(product.name)}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {displayName(product.category.name)} ·{" "}
                    {displayName(product.seller.businessName)} ·{" "}
                    {product.variants.length} variante(s)
                  </span>
                </span>
              </span>
              <span className="text-muted-foreground text-xs">
                {productStatuses.find(
                  ([value]) => value === product.status,
                )?.[1] ?? product.status}
              </span>
            </summary>

            <div className="mt-4 space-y-5 border-t pt-4">
              <ActionFeedbackForm
                action={updateCatalogProductAction}
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                successMessage="Dados do produto actualizados."
                errorMessage="Não foi possível guardar o produto. Verifique os dados e as fotos."
              >
                <input type="hidden" name="productId" value={product.id} />
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
                    defaultValue={product.categoryId}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {displayName(category.name)}
                        {category.isActive ? "" : " (inativa)"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Estado">
                  <ProductStatusSelect defaultValue={product.status} />
                </Field>
                <Field label="Marca">
                  <input
                    className={inputClass}
                    name="brand"
                    defaultValue={displayName(product.brand ?? "")}
                    maxLength={100}
                  />
                </Field>
                <Field label="Descrição">
                  <Textarea
                    name="description"
                    defaultValue={product.description ?? ""}
                    maxLength={2000}
                  />
                </Field>
                <div className="text-muted-foreground self-end text-sm">
                  Vendedor: {displayName(product.seller.businessName)}
                </div>
                {product.images.length ? (
                  <div className="grid gap-2 sm:col-span-2 xl:col-span-3">
                    <span className="text-sm font-medium">Fotos atuais</span>
                    <div className="flex flex-wrap gap-3">
                      {product.images.map((image) => {
                        const url = safeImageUrl(image.url ?? "");
                        return (
                          <label
                            key={image.id}
                            className="grid w-28 gap-1.5 text-xs"
                          >
                            <span className="bg-muted relative aspect-square overflow-hidden rounded-lg border">
                              {url ? (
                                <Image
                                  src={url}
                                  alt={image.alt || displayName(product.name)}
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
                              />
                              Remover foto
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <Field label="Adicionar fotos">
                  <input
                    className={`${inputClass} py-2`}
                    name="images"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                  />
                  <span className="text-muted-foreground text-xs font-normal">
                    Até 4 fotos por envio, 1,5 MB cada e 3 MB no total.
                  </span>
                </Field>
                <div className="flex items-end">
                  <Button type="submit" variant="outline">
                    Guardar produto
                  </Button>
                </div>
              </ActionFeedbackForm>

              <div className="space-y-3">
                <h3 className="font-semibold">Preços, promoções e stock</h3>
                {product.variants.map((variant) => (
                  <ActionFeedbackForm
                    key={variant.id}
                    action={updateCatalogVariantAction}
                    className="bg-muted/40 grid gap-3 rounded-xl p-3 sm:grid-cols-2 xl:grid-cols-4"
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
                          (variant.compareAtPriceCents ?? variant.priceCents) /
                          100
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
                        defaultValue={String(
                          variant.inventory?.quantityOnHand ?? 0,
                        )}
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
                      <p className="text-primary text-xs sm:col-span-2 xl:col-span-4">
                        Promoção activa: {formatPrice(variant.priceCents)} em
                        vez de {formatPrice(variant.compareAtPriceCents)}.
                      </p>
                    ) : null}
                  </ActionFeedbackForm>
                ))}
                {!product.variants.length ? (
                  <p className="text-muted-foreground text-sm">
                    Este produto ainda não tem opções de compra.
                  </p>
                ) : null}
              </div>
            </div>
          </details>
        ))}
        {!filteredProducts.length ? (
          <p className="text-muted-foreground rounded-xl border p-5 text-sm">
            {products.length
              ? "Nenhum produto corresponde à pesquisa."
              : "Ainda não há produtos reais no catálogo."}
          </p>
        ) : null}
      </div>

      <section className="space-y-4 rounded-xl border p-4">
        <div>
          <h3 className="font-semibold">Categorias de produtos</h3>
          <p className="text-muted-foreground text-sm">
            Crie categorias e active ou desactive as opções disponíveis na loja.
          </p>
        </div>
        <ActionFeedbackForm
          action={createCategoryAction}
          className="flex flex-wrap gap-2"
          successMessage="Categoria criada."
          errorMessage="Não foi possível criar a categoria. Verifique os campos e tente novamente."
        >
          <input
            className={`${inputClass} min-w-48 flex-1`}
            name="name"
            placeholder="Nome da nova categoria"
            required
            minLength={2}
            maxLength={80}
          />
          <input
            className={`${inputClass} min-w-48 flex-1`}
            name="description"
            placeholder="Descrição (opcional)"
            maxLength={500}
          />
          <Button>Criar categoria</Button>
        </ActionFeedbackForm>
        {categories.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div>
                  <p className="font-medium">
                    {displayName(category.name)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {category.requiresReview
                      ? "Requer revisão de produtos"
                      : "Revisão normal"}
                    {category.isActive ? " · Activa" : " · Inactiva"}
                  </p>
                </div>
                <ActionFeedbackForm
                  action={setCategoryActiveAction}
                  successMessage="Estado da categoria actualizado."
                  errorMessage="Não foi possível actualizar a categoria. Actualize a página e tente novamente."
                >
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={String(!category.isActive)}
                  />
                  <Button size="sm" variant="outline">
                    {category.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </ActionFeedbackForm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Ainda não há categorias reais configuradas.
          </p>
        )}
      </section>
    </section>
  );
}
