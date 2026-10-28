import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../../prisma/seed/catalog-data";
import { productImageAsset } from "@/lib/product-image";

describe("demo catalogue product photographs", () => {
  it("assigns an existing, distinct image to every named product", () => {
    const assigned = PRODUCTS.map(({ name }) => ({
      name,
      asset: productImageAsset(name),
    }));

    expect(
      assigned.filter(({ asset }) => !asset).map(({ name }) => name),
    ).toEqual([]);

    const imageSlots = assigned.map(({ asset }) =>
      asset ? `${asset.src}#${asset.position ?? "full"}` : "missing",
    );
    expect(new Set(imageSlots).size).toBe(PRODUCTS.length);

    for (const { asset } of assigned) {
      if (asset) {
        expect(
          existsSync(path.join(process.cwd(), "public", asset.src.slice(1))),
        ).toBe(true);
      }
    }
  });
});
