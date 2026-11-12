"use server";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export type SaveAddressState =
  { ok: true; message: string } | { ok: false; error: string };

export async function saveAddressAction(
  _previousState: SaveAddressState | null,
  formData: FormData,
): Promise<SaveAddressState> {
  const session = await getAppSession();
  if (!session?.actor.roles.includes("CUSTOMER"))
    return { ok: false, error: "Inicie sessão para guardar uma morada." };
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
    ].some((item) => !item)
  )
    return { ok: false, error: "Preencha os campos obrigatórios da morada." };
  if (phone.length > 30)
    return {
      ok: false,
      error: "O telefone deve ter até 30 caracteres.",
    };
  const isDefault = formData.get("isDefault") === "on";
  try {
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
  } catch {
    return {
      ok: false,
      error: "Não foi possível guardar a morada. Tente novamente.",
    };
  }
  revalidatePath("/cliente/moradas");
  revalidatePath("/checkout");
  return { ok: true, message: "Morada guardada com sucesso." };
}
