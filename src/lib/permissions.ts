import type { Role } from "@/generated/prisma/client";

/**
 * Typed permission catalogue. Authorization is enforced in services;
 * this map is the single source of truth for role → capability.
 */
export const PERMISSIONS = [
  "catalog:read",
  "product:create",
  "product:update",
  "product:approve",
  "seller:approve",
  "category:manage",
  "order:create",
  "order:read",
  "order:read_all",
  "seller_order:update",
  "delivery:assign",
  "delivery:update",
  "payment:read",
  "payment:read_all",
  "commission:read",
  "commission:manage",
  "payout:create",
  "user:manage",
  "driver:manage",
  "settings:manage",
  "audit:read",
  "review:create",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_ADMIN: Permission[] = [
  "catalog:read",
  "product:create",
  "product:update",
  "product:approve",
  "seller:approve",
  "category:manage",
  "order:create",
  "order:read",
  "order:read_all",
  "seller_order:update",
  "delivery:assign",
  "delivery:update",
  "payment:read",
  "payment:read_all",
  "commission:read",
  "commission:manage",
  "payout:create",
  "user:manage",
  "driver:manage",
  "settings:manage",
  "audit:read",
  "review:create",
];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: ALL_ADMIN,
  ADMIN: ALL_ADMIN.filter((p) => p !== "commission:manage"),
  SELLER: [
    "catalog:read",
    "product:create",
    "product:update",
    "order:read",
    "seller_order:update",
    "payment:read",
    "commission:read",
  ],
  CUSTOMER: [
    "catalog:read",
    "order:create",
    "order:read",
    "payment:read",
    "review:create",
  ],
  DRIVER: ["catalog:read", "delivery:update", "order:read"],
};

export type Actor = {
  userId: string;
  roles: Role[];
  sellerId?: string | null;
  driverId?: string | null;
};

export function permissionsForRoles(roles: Role[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      set.add(permission);
    }
  }
  return set;
}

export function can(actor: Actor, permission: Permission): boolean {
  return permissionsForRoles(actor.roles).has(permission);
}

export function assertCan(actor: Actor, permission: Permission): void {
  if (!can(actor, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export class PermissionDeniedError extends Error {
  readonly code = "PERMISSION_DENIED" as const;

  constructor(readonly permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}
