import { describe, expect, it } from "vitest";
import { normalizeCatalogQuery } from "@/services/catalog/catalog-service";

describe("normalizeCatalogQuery", () => {
  it("normalizes shareable search, category and stock filters", () => {
    expect(
      normalizeCatalogQuery({
        q: "  Milho  ",
        categoria: "sementes-e-mudas",
        stock: "1",
      }),
    ).toMatchObject({
      q: "Milho",
      category: "sementes-e-mudas",
      sort: "relevance",
      page: 1,
      inStock: true,
    });
  });

  it("ignores repeated and invalid inputs and clamps the page", () => {
    expect(
      normalizeCatalogQuery({
        q: ["milho", "feijão"],
        categoria: "../../private",
        ordenar: "raw-sql",
        pagina: "99999",
        stock: "yes",
      }),
    ).toMatchObject({
      q: "",
      category: "",
      sort: "recent",
      page: 10_000,
      inStock: false,
    });
  });

  it("bounds price inputs and orders a reversed price interval", () => {
    expect(
      normalizeCatalogQuery({ minimo: "300.50", maximo: "20" }),
    ).toMatchObject({ minPriceCents: 2_000, maxPriceCents: 30_050 });
    expect(
      normalizeCatalogQuery({ minimo: "1e9", maximo: "-1" }),
    ).toMatchObject({ minPriceCents: null, maxPriceCents: null });
  });
});
