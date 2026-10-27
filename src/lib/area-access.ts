import type { Role } from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";

export const APP_AREAS = [
  "admin",
  "vendedor",
  "entregador",
  "cliente",
] as const;

export type AppArea = (typeof APP_AREAS)[number];

/** Roles allowed to enter each protected area (layout guard). */
export const AREA_ROLES: Record<AppArea, readonly Role[]> = {
  admin: ["SUPER_ADMIN", "ADMIN"],
  vendedor: ["SELLER"],
  entregador: ["DRIVER"],
  cliente: ["CUSTOMER"],
};

export const AREA_PATH_PREFIX: Record<AppArea, string> = {
  admin: "/admin",
  vendedor: "/vendedor",
  entregador: "/entregador",
  cliente: "/cliente",
};

export function areaFromPathname(pathname: string): AppArea | null {
  for (const area of APP_AREAS) {
    const prefix = AREA_PATH_PREFIX[area];
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return area;
    }
  }
  return null;
}

export function canAccessArea(actor: Actor, area: AppArea): boolean {
  const allowed = AREA_ROLES[area];
  return actor.roles.some((role) => allowed.includes(role));
}

/**
 * Only same-origin relative paths. Blocks open redirects (`//evil`, `https://…`).
 */
export function safeInternalPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("://")) return fallback;
  if (next.includes("\\")) return fallback;
  return next;
}
