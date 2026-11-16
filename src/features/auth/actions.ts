"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { defaultAreaPathForRoles } from "@/lib/area-access";
import { prisma } from "@/lib/db";
import { getAppSession } from "@/lib/session";

export type SellerRegistrationInput = {
  businessName: string;
  phone: string;
  province: string;
  district: string;
  addressText: string;
};

export async function getPostLoginPathAction(): Promise<string> {
  const session = await getAppSession();
  return session ? defaultAreaPathForRoles(session.actor.roles) : "/";
}

export async function registerSellerAccountAction(
  input: SellerRegistrationInput,
) {
  const session = await getAppSession();
  if (!session)
    throw new Error("A sessão de registo expirou. Entre novamente.");

  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const province = input.province.trim();
  const district = input.district.trim();
  const addressText = input.addressText.trim();
  const email = session.user.email.trim().toLowerCase();
  const accountName = session.user.name.trim();

  if (
    businessName.length < 2 ||
    businessName.length > 160 ||
    phone.length < 7 ||
    phone.length > 32 ||
    province.length < 2 ||
    province.length > 100 ||
    district.length < 2 ||
    district.length > 100 ||
    addressText.length < 3 ||
    addressText.length > 300
  )
    throw new Error("Verifique os dados comerciais e o endereço da loja.");

  if (
    accountName.startsWith("[DEV]") ||
    businessName.startsWith("[DEV]") ||
    email.endsWith("@dev.agroconet.local") ||
    email.endsWith("@example.invalid")
  )
    throw new Error(
      "Use os dados reais da pessoa e do negócio para se candidatar como vendedor.",
    );

  const slugBase =
    businessName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "vendedor";

  try {
    await prisma.$transaction(async (tx) => {
      const roles = await tx.userRole.findMany({
        where: { userId: session.user.id },
        select: { role: true },
      });
      const existingSeller = await tx.seller.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (existingSeller) {
        if (roles.some((item) => item.role === "SELLER")) return;
        throw new Error("A conta já tem um perfil comercial por rever.");
      }
      if (roles.length !== 1 || roles[0]?.role !== "CUSTOMER")
        throw new Error(
          "Só uma conta de cliente nova pode candidatar-se como vendedor.",
        );

      await tx.seller.create({
        data: {
          userId: session.user.id,
          businessName,
          phone,
          province,
          district,
          addressText,
          slug: `${slugBase}-${randomUUID().slice(0, 8)}`,
          status: "PENDING",
        },
      });
      await tx.customer.deleteMany({
        where: { userId: session.user.id },
      });
      await tx.userRole.deleteMany({
        where: { userId: session.user.id, role: "CUSTOMER" },
      });
      await tx.userRole.create({
        data: { userId: session.user.id, role: "SELLER" },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("A conta já"))
      throw error;
    if (error instanceof Error && error.message.startsWith("Só uma conta"))
      throw error;
    throw new Error(
      "Não foi possível enviar a candidatura de vendedor. Tente novamente.",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/vendedor");
}
