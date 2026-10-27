import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import {
  canAccessArea,
  type AppArea,
  safeInternalPath,
} from "@/lib/area-access";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Actor } from "@/lib/permissions";

export type AppSession = {
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    phoneNumberVerified: boolean;
    image?: string | null;
  };
  actor: Actor;
};

export async function getAppSession(): Promise<AppSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const [roles, seller, driver] = await Promise.all([
    prisma.userRole.findMany({
      where: { userId: session.user.id },
      select: { role: true },
    }),
    prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
    prisma.driver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
  ]);

  const roleList = roles.map((r) => r.role) as Role[];
  const user = session.user as typeof session.user & {
    phoneNumber?: string | null;
    phoneNumberVerified?: boolean;
  };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      phoneNumberVerified: Boolean(user.phoneNumberVerified),
      image: user.image,
    },
    actor: {
      userId: user.id,
      roles: roleList,
      sellerId: seller?.id ?? null,
      driverId: driver?.id ?? null,
    },
  };
}

export async function requireAppSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/**
 * Layout guard: requires a signed-in user with a role for the given area.
 * Unauthenticated → login; wrong role → home (no area leakage).
 */
export async function requireAreaSession(area: AppArea): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) {
    redirect(`/entrar?next=${encodeURIComponent(`/${area}`)}`);
  }
  if (!canAccessArea(session.actor, area)) {
    redirect(safeInternalPath("/"));
  }
  return session;
}
