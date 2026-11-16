"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminService } from "@/services/admin/admin-service";

const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_UPLOAD_BYTES = 3_000_000;

function uploadedImageType(
  bytes: Buffer,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

async function productImages(formData: FormData, alt: string) {
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_IMAGE_COUNT)
    throw new Error("Pode enviar no máximo quatro fotos por vez.");

  let totalBytes = 0;
  const images = [];
  for (const file of files) {
    totalBytes += file.size;
    if (file.size > MAX_IMAGE_BYTES || totalBytes > MAX_UPLOAD_BYTES)
      throw new Error("As fotos devem ter até 1,5 MB cada e 3 MB no total.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = uploadedImageType(bytes);
    if (!mimeType || (file.type && file.type !== mimeType))
      throw new Error("Use fotos PNG, JPEG ou WebP válidas.");
    images.push({
      storageKey: `data:${mimeType};base64,${bytes.toString("base64")}`,
      alt: alt.trim().slice(0, 200),
    });
  }
  return images;
}

function refreshCatalog() {
  updateTag("products");
  updateTag("landing");
  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath("/produtos/[slug]", "page");
  revalidatePath("/");
}

export async function reviewSellerAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "reject")
    throw new Error("Escolha uma decisão válida.");
  const approved = decision === "approve";
  await new AdminService(prisma).reviewSeller(
    session.actor,
    id,
    approved,
    String(formData.get("reason") ?? ""),
  );
  refreshCatalog();
}

export async function reviewProductAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "reject")
    throw new Error("Escolha uma decisão válida.");
  const approved = decision === "approve";
  await new AdminService(prisma).reviewProduct(
    session.actor,
    id,
    approved,
    String(formData.get("reason") ?? ""),
  );
  refreshCatalog();
}

export async function approveDriverAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  await new AdminService(prisma).approveDriver(
    session.actor,
    String(formData.get("id") ?? ""),
  );
  revalidatePath("/admin");
}

export async function createCategoryAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  await new AdminService(prisma).createCategory(session.actor, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  refreshCatalog();
}

export async function setCategoryActiveAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  await new AdminService(prisma).setCategoryActive(
    session.actor,
    String(formData.get("id") ?? ""),
    (() => {
      const active = String(formData.get("active") ?? "");
      if (active !== "true" && active !== "false")
        throw new Error("Estado de categoria inválido.");
      return active === "true";
    })(),
  );
  refreshCatalog();
}

export async function createCatalogProductAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const name = String(formData.get("name") ?? "");
  await new AdminService(prisma).createCatalogProduct(session.actor, {
    name,
    description: String(formData.get("description") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    sellerId: String(formData.get("sellerId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE"),
    label: String(formData.get("label") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    unit: String(formData.get("unit") ?? "UNIT"),
    unitSize: Number(formData.get("unitSize") ?? 1),
    normalPriceCents: Math.round(
      Number(formData.get("normalPrice") ?? 0) * 100,
    ),
    promoPriceCents: Math.round(Number(formData.get("promoPrice") ?? 0) * 100),
    stock: Number(formData.get("stock") ?? 0),
    isFeatured: formData.get("isFeatured") === "on",
    images: await productImages(formData, name),
  });
  refreshCatalog();
}

export async function updateCatalogProductAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const name = String(formData.get("name") ?? "");
  await new AdminService(prisma).updateCatalogProduct(session.actor, {
    productId: String(formData.get("productId") ?? ""),
    name,
    description: String(formData.get("description") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    status: String(formData.get("status") ?? ""),
    isFeatured: formData.get("isFeatured") === "on",
    removeImageIds: formData
      .getAll("removeImageId")
      .map(String)
      .filter(Boolean),
    images: await productImages(formData, name),
  });
  refreshCatalog();
}

export async function setCatalogProductFeaturedAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const featured = String(formData.get("featured") ?? "");
  if (featured !== "true" && featured !== "false")
    throw new Error("Estado de destaque inválido.");
  await new AdminService(prisma).setCatalogProductFeatured(
    session.actor,
    String(formData.get("productId") ?? ""),
    featured === "true",
  );
  refreshCatalog();
}

export async function updateCatalogVariantAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  await new AdminService(prisma).updateCatalogVariant(session.actor, {
    productId: String(formData.get("productId") ?? ""),
    variantId: String(formData.get("variantId") ?? ""),
    label: String(formData.get("label") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    unit: String(formData.get("unit") ?? "UNIT"),
    unitSize: Number(formData.get("unitSize") ?? 1),
    normalPriceCents: Math.round(
      Number(formData.get("normalPrice") ?? 0) * 100,
    ),
    promoPriceCents: Math.round(Number(formData.get("promoPrice") ?? 0) * 100),
    stock: Number(formData.get("stock") ?? 0),
  });
  refreshCatalog();
}

export async function removeCatalogProductAction(productId: string) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  await new AdminService(prisma).removeCatalogProduct(session.actor, productId);
  refreshCatalog();
}
