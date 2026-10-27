"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAreaSession } from "@/lib/session";
import { SellerService } from "@/services/seller/seller-service";

export async function createSellerProductAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  const service = new SellerService(prisma);
  try {
    await service.createProduct(session.actor, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      brand: String(formData.get("brand") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      label: String(formData.get("label") ?? ""),
      unit: String(formData.get("unit") ?? "UNIT"),
      unitSize: Number(formData.get("unitSize") ?? 1),
      priceCents: Math.round(Number(formData.get("price") ?? 0) * 100),
      sku: String(formData.get("sku") ?? ""),
      startingStock: Number(formData.get("stock") ?? 0),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Não foi possível guardar o produto.",
    );
  }
  revalidatePath("/vendedor");
}

export async function adjustSellerStockAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  await new SellerService(prisma).adjustStock(
    session.actor,
    String(formData.get("variantId") ?? ""),
    Number(formData.get("quantity") ?? 0),
    String(formData.get("reason") ?? ""),
  );
  revalidatePath("/vendedor");
}

export async function updateSellerProductAction(formData: FormData) {
  const session = await requireAreaSession("vendedor");
  await new SellerService(prisma).updateProduct(session.actor, {
    productId: String(formData.get("productId") ?? ""),
    variantId: String(formData.get("variantId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    label: String(formData.get("label") ?? ""),
    priceCents: Math.round(Number(formData.get("price") ?? 0) * 100),
  });
  revalidatePath("/vendedor");
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
