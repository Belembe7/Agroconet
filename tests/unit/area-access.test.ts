import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/client";
import {
  APP_AREAS,
  AREA_ROLES,
  areaFromPathname,
  canAccessArea,
  safeInternalPath,
} from "@/lib/area-access";
import type { Actor } from "@/lib/permissions";

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "SELLER", "CUSTOMER", "DRIVER"];

function actor(roles: Role[]): Actor {
  return { userId: "u-test", roles };
}

describe("area access matrix", () => {
  for (const role of ROLES) {
    for (const area of APP_AREAS) {
      const expected = AREA_ROLES[area].includes(role);
      it(`${role} ${expected ? "can" : "cannot"} access /${area}`, () => {
        expect(canAccessArea(actor([role]), area)).toBe(expected);
      });
    }
  }

  it("allows multi-role users into each of their areas", () => {
    const both = actor(["CUSTOMER", "SELLER"]);
    expect(canAccessArea(both, "cliente")).toBe(true);
    expect(canAccessArea(both, "vendedor")).toBe(true);
    expect(canAccessArea(both, "admin")).toBe(false);
  });

  it("blocks customer from admin/vendedor/entregador (cross-access)", () => {
    const customer = actor(["CUSTOMER"]);
    expect(canAccessArea(customer, "admin")).toBe(false);
    expect(canAccessArea(customer, "vendedor")).toBe(false);
    expect(canAccessArea(customer, "entregador")).toBe(false);
  });
});

describe("areaFromPathname", () => {
  it("resolves protected prefixes", () => {
    expect(areaFromPathname("/admin")).toBe("admin");
    expect(areaFromPathname("/admin/users")).toBe("admin");
    expect(areaFromPathname("/vendedor/produtos")).toBe("vendedor");
    expect(areaFromPathname("/produtos")).toBeNull();
  });
});

describe("safeInternalPath", () => {
  it("allows relative internal paths", () => {
    expect(safeInternalPath("/cliente")).toBe("/cliente");
    expect(safeInternalPath("/admin/x")).toBe("/admin/x");
  });

  it("rejects open redirects", () => {
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("https://evil.com")).toBe("/");
    expect(safeInternalPath("http://evil.com")).toBe("/");
    expect(safeInternalPath("\\evil")).toBe("/");
    expect(safeInternalPath(null)).toBe("/");
  });
});
