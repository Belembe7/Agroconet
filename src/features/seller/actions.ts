"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAreaSession } from "@/lib/session";
import {
  SellerService,
  type SellerProductImageInput,
} from "@/services/seller/seller-service";

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

async function sellerProductImages(
  formData: FormData,
  alt: string,
): Promise<SellerProductImageInput[]> {
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_IMAGE_COUNT)
    throw new Error("Pode enviar no máximo quatro fotos por vez.");
  let totalBytes = 0;
  const images: SellerProductImageInput[] = [];
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

function refreshSellerCatalog() {
  updateTag("products");
  updateTag("landing");
  revalidatePath("/vendedor");
  revalidatePath("/produtos");
  revalidatePath("/produtos/[slug]", "page");
  revalidatePath("/");
}

export async function createSellerProductAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  const service = new SellerService(prisma);
  const name = String(formData.get("name") ?? "");
  try {
    await service.createProduct(session.actor, {
      name,
      description: String(formData.get("description") ?? ""),
      brand: String(formData.get("brand") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      label: String(formData.get("label") ?? ""),
      unit: String(formData.get("unit") ?? "UNIT"),
      unitSize: Number(formData.get("unitSize") ?? 1),
      normalPriceCents: Math.round(
        Number(formData.get("normalPrice") ?? 0) * 100,
      ),
      promoPriceCents: Math.round(
        Number(formData.get("promoPrice") ?? 0) * 100,
      ),
      lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 5),
      sku: String(formData.get("sku") ?? ""),
      startingStock: Number(formData.get("stock") ?? 0),
      isFeatured: formData.get("isFeatured") === "on",
      images: await sellerProductImages(formData, name),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Não foi possível guardar o produto.",
    );
  }
  refreshSellerCatalog();
}

export async function adjustSellerStockAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  await new SellerService(prisma).adjustStock(
    session.actor,
    String(formData.get("variantId") ?? ""),
    Number(formData.get("quantity") ?? 0),
    String(formData.get("reason") ?? ""),
  );
  refreshSellerCatalog();
}

export async function updateSellerProductAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  const name = String(formData.get("name") ?? "");
  const images = await sellerProductImages(formData, name);
  await new SellerService(prisma).updateProduct(session.actor, {
    productId: String(formData.get("productId") ?? ""),
    variantId: String(formData.get("variantId") ?? ""),
    name,
    description: String(formData.get("description") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    label: String(formData.get("label") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    unit: String(formData.get("unit") ?? "UNIT"),
    unitSize: Number(formData.get("unitSize") ?? 1),
    normalPriceCents: Math.round(
      Number(formData.get("normalPrice") ?? 0) * 100,
    ),
    promoPriceCents: Math.round(Number(formData.get("promoPrice") ?? 0) * 100),
    lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 5),
    images,
    replaceImages: images.length > 0 || formData.get("removeImages") === "on",
  });
  refreshSellerCatalog();
}

export async function setSellerProductActiveAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  const active = String(formData.get("active") ?? "");
  if (active !== "true" && active !== "false")
    throw new Error("Estado do produto inválido.");
  await new SellerService(prisma).setProductActive(
    session.actor,
    String(formData.get("productId") ?? ""),
    active === "true",
  );
  refreshSellerCatalog();
}

export async function setSellerProductFeaturedAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  const featured = String(formData.get("featured") ?? "");
  if (featured !== "true" && featured !== "false")
    throw new Error("Estado de destaque inválido.");
  await new SellerService(prisma).setProductFeatured(
    session.actor,
    String(formData.get("productId") ?? ""),
    featured === "true",
  );
  refreshSellerCatalog();
}

export async function updateSellerOrderAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  const next = String(formData.get("next") ?? "");
  if (
    next !== "CONFIRMED" &&
    next !== "REJECTED" &&
    next !== "READY_FOR_PICKUP"
  )
    throw new Error("Estado inválido.");
  await new SellerService(prisma).updateOrder(
    session.actor,
    String(formData.get("orderId") ?? ""),
    next,
    String(formData.get("reason") ?? ""),
  );
  revalidatePath("/vendedor");
}

export async function updateSellerProfileAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  await new SellerService(prisma).updateProfile(session.actor, {
    businessName: String(formData.get("businessName") ?? ""),
    legalName: String(formData.get("legalName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    province: String(formData.get("province") ?? ""),
    district: String(formData.get("district") ?? ""),
    addressText: String(formData.get("addressText") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  revalidatePath("/vendedor");
}
