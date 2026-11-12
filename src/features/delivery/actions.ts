"use server";

import { revalidatePath } from "next/cache";
import { DeliveryStatus } from "@/generated/prisma/client";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { DeliveryService } from "@/services/delivery/delivery-service";

export async function deliveryTransitionAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const next = String(formData.get("status") ?? "") as DeliveryStatus;
  if (!Object.values(DeliveryStatus).includes(next))
    throw new Error("Estado inválido.");
  const code = String(formData.get("code") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (next === "DELIVERED" && !/^\d{6}$/.test(code))
    throw new Error("O código de confirmação deve ter 6 dígitos.");
  if (next === "FAILED" && (note.length < 3 || note.length > 500))
    throw new Error("Indique um motivo de falha entre 3 e 500 caracteres.");
  await new DeliveryService(prisma).transition(
    session.actor,
    String(formData.get("id") ?? ""),
    next,
    {
      code,
      note,
    },
  );
  revalidatePath("/entregador");
  revalidatePath("/admin");
}

export async function toggleAvailabilityAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const available = String(formData.get("available") ?? "");
  if (available !== "true" && available !== "false")
    throw new Error("Disponibilidade inválida.");
  await new DeliveryService(prisma).toggleAvailability(
    session.actor,
    available === "true",
  );
  revalidatePath("/entregador");
}

export async function assignDeliveryAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  await new DeliveryService(prisma).assign(
    session.actor,
    String(formData.get("deliveryId") ?? ""),
    String(formData.get("driverId") ?? ""),
  );
  revalidatePath("/admin");
  revalidatePath("/entregador");
}

export async function createZoneAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const areas = String(formData.get("areas") ?? "")
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean);
  const fee = Number(formData.get("baseFeeMzn"));
  if (!Number.isFinite(fee)) throw new Error("Taxa inválida.");
  await new DeliveryService(prisma).createZone(session.actor, {
    name: String(formData.get("name") ?? ""),
    province: String(formData.get("province") ?? ""),
    areas,
    baseFeeCents: Math.round(fee * 100),
  });
  revalidatePath("/admin");
}

export async function createConfirmationCodeAction(formData: FormData) {
  const session = await getAppSession();
  if (!session) throw new Error("Sessão necessária.");
  const code = await new DeliveryService(prisma).createConfirmationCode(
    session.actor,
    String(formData.get("deliveryId") ?? ""),
  );
  revalidatePath("/admin");
  return code;
}
