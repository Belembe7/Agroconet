"use server";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
export async function saveAddressAction(formData: FormData) {
  const session = await getAppSession();
  if (!session?.actor.roles.includes("CUSTOMER"))
    throw new Error("Sessão de cliente necessária.");
  const value = (key: string) => String(formData.get(key) ?? "").trim();
  const label = value("label"),
    recipientName = value("recipientName"),
    phone = value("phone"),
    province = value("province"),
    district = value("district"),
    neighborhood = value("neighborhood"),
    reference = value("reference");
  if (
    [
      label,
      recipientName,
      phone,
      province,
      district,
      neighborhood,
      reference,
    ].some((item) => !item) ||
    phone.length > 30
  )
    throw new Error("Preencha os campos obrigatórios da morada.");
  const isDefault = formData.get("isDefault") === "on";
  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: session.user.id, deletedAt: null },
        data: { isDefault: false },
      });
      await tx.customer.updateMany({
        where: { userId: session.user.id },
        data: { defaultAddressId: null },
      });
    }
    const address = await tx.address.create({
      data: {
        userId: session.user.id,
        label,
        recipientName,
        phone,
        province,
        district,
        neighborhood,
        reference,
        street: value("street") || null,
        isDefault,
      },
    });
    if (isDefault)
      await tx.customer.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, defaultAddressId: address.id },
        update: { defaultAddressId: address.id },
      });
  });
  revalidatePath("/cliente/moradas");
  revalidatePath("/checkout");
}
