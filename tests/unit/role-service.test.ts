import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { PermissionDeniedError } from "@/lib/permissions";
import { assertCanGrantRole, canGrantRole } from "@/services/auth/role-service";

function actor(roles: Role[]): Actor {
  return { userId: "actor-1", roles };
}

describe("canGrantRole", () => {
  it("allows SUPER_ADMIN to grant any role", () => {
    const a = actor(["SUPER_ADMIN"]);
    for (const role of [
      "SUPER_ADMIN",
      "ADMIN",
      "SELLER",
      "CUSTOMER",
      "DRIVER",
    ] as Role[]) {
      expect(canGrantRole(a, role)).toBe(true);
    }
  });

  it("allows ADMIN to grant operational roles but not admin roles", () => {
    const a = actor(["ADMIN"]);
    expect(canGrantRole(a, "SELLER")).toBe(true);
    expect(canGrantRole(a, "CUSTOMER")).toBe(true);
    expect(canGrantRole(a, "DRIVER")).toBe(true);
    expect(canGrantRole(a, "ADMIN")).toBe(false);
    expect(canGrantRole(a, "SUPER_ADMIN")).toBe(false);
  });

  it("denies sellers, customers and drivers from granting roles", () => {
    for (const roles of [["SELLER"], ["CUSTOMER"], ["DRIVER"]] as Role[][]) {
      expect(canGrantRole(actor(roles), "CUSTOMER")).toBe(false);
    }
  });

  it("assertCanGrantRole throws for unauthorized actors", () => {
    expect(() => assertCanGrantRole(actor(["CUSTOMER"]), "SELLER")).toThrow(
      PermissionDeniedError,
    );
  });
});
