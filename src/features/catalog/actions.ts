"use server";

import { revalidatePath } from "next/cache";
import { FavoriteService } from "@/services/catalog/favorite-service";
import { prisma } from "@/lib/db";
import { getAppSession } from "@/lib/session";

export type FavoriteActionResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string; loginRequired?: boolean };

export async function toggleFavoriteAction(
  slug: string,
): Promise<FavoriteActionResult> {
  if (!/^[a-z0-9][a-z0-9-]{0,149}$/.test(slug))
    return { ok: false, error: "Produto inválido." };
  const session = await getAppSession();
  if (!session)
    return {
      ok: false,
      error: "Entre para guardar os favoritos.",
      loginRequired: true,
    };
  if (!session.actor.roles.includes("CUSTOMER"))
    return {
      ok: false,
      error: "Os favoritos estão disponíveis para clientes.",
    };
  const activeUser = await prisma.user.findFirst({
    where: { id: session.user.id, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!activeUser)
    return {
      ok: false,
      error: "Esta conta não está activa para guardar favoritos.",
    };

  const result = await new FavoriteService(prisma).toggleBySlug(
    session.user.id,
    slug,
  );
  if (!result.ok) return result;
  revalidatePath("/favoritos");
  revalidatePath(`/produtos/${encodeURIComponent(slug)}`);
  return result;
}
