import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/client";
import {
  assertCan,
  can,
  PERMISSIONS,
  PermissionDeniedError,
  type Actor,
  type Permission,
} from "@/lib/permissions";

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SELLER", "CUSTOMER", "DRIVER"];

function actor(roles: Role[]): Actor {
  return { userId: "u-test", roles };
}

/** Expected allowance matrix: role → permissions that must be true. */
const EXPECTED: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: PERMISSIONS.filter((p) => p !== "commission:manage"),
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

describe("permissions matrix", () => {
  for (const role of ROLES) {
    it(`matches the catalogue for ${role}`, () => {
      const a = actor([role]);
      const allowed = new Set(EXPECTED[role]);
      for (const permission of PERMISSIONS) {
        expect(can(a, permission)).toBe(allowed.has(permission));
      }
    });
  }

  it("unions permissions when a user has multiple roles", () => {
    const both = actor(["CUSTOMER", "SELLER"]);
    expect(can(both, "order:create")).toBe(true);
    expect(can(both, "product:create")).toBe(true);
    expect(can(both, "product:approve")).toBe(false);
  });

  it("assertCan throws PermissionDeniedError", () => {
    expect(() => assertCan(actor(["CUSTOMER"]), "settings:manage")).toThrow(
      PermissionDeniedError,
    );
  });

  it("denies customers from admin-only actions (cross-access)", () => {
    const customer = actor(["CUSTOMER"]);
    expect(can(customer, "product:approve")).toBe(false);
    expect(can(customer, "seller:approve")).toBe(false);
    expect(can(customer, "user:manage")).toBe(false);
    expect(can(customer, "audit:read")).toBe(false);
  });

  it("denies sellers from approving other sellers or products", () => {
    const seller = actor(["SELLER"]);
    expect(can(seller, "seller:approve")).toBe(false);
    expect(can(seller, "product:approve")).toBe(false);
    expect(can(seller, "order:read_all")).toBe(false);
  });

  it("denies drivers from creating orders or managing users", () => {
    const driver = actor(["DRIVER"]);
    expect(can(driver, "order:create")).toBe(false);
    expect(can(driver, "user:manage")).toBe(false);
    expect(can(driver, "delivery:assign")).toBe(false);
  });
});
