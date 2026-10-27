"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminService } from "@/services/admin/admin-service";

export async function reviewSellerAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const id = String(formData.get("id") ?? "");
  const approved = formData.get("decision") === "approve";
  await new AdminService(prisma).reviewSeller(
    session.actor,
    id,
    approved,
    String(formData.get("reason") ?? ""),
  );
  revalidatePath("/admin");
}

export async function reviewProductAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const id = String(formData.get("id") ?? "");
  const approved = formData.get("decision") === "approve";
  await new AdminService(prisma).reviewProduct(
    session.actor,
    id,
    approved,
    String(formData.get("reason") ?? ""),
  );
  revalidatePath("/admin");
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
  revalidatePath("/admin");
  revalidatePath("/produtos");
}

export async function setCategoryActiveAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  await new AdminService(prisma).setCategoryActive(
    session.actor,
    String(formData.get("id") ?? ""),
    formData.get("active") === "true",
  );
  revalidatePath("/admin");
  revalidatePath("/produtos");
}
