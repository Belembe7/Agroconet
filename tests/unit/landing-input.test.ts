import { describe, expect, it } from "vitest";
import {
  normalizeLandingQuery,
  parsePublicContacts,
} from "@/services/catalog/landing-service";

describe("entrada pública da landing", () => {
  it("normaliza espaços, limita pesquisa e ignora parâmetros repetidos", () => {
    expect(
      normalizeLandingQuery({ q: " milho ", categoria: "sementes" }),
    ).toEqual({ q: "milho", category: "sementes" });
    expect(normalizeLandingQuery({ q: ["a", "b"], categoria: ["x"] })).toEqual({
      q: "",
      category: "",
    });
    expect(normalizeLandingQuery({ q: "a".repeat(300) }).q).toHaveLength(100);
  });
  it("ignora categorias inválidas sem transformar o input em código", () => {
    expect(normalizeLandingQuery({ categoria: "../../admin" }).category).toBe(
      "",
    );
    expect(normalizeLandingQuery({ q: "' OR 1=1" }).q).toBe("' OR 1=1");
  });
  it("aceita contactos válidos e publica apenas os campos públicos", () => {
    expect(
      parsePublicContacts({
        phone: "+258 84 000 0000",
        email: "ola@example.com",
        city: "Maputo",
        secret: "private",
      }),
    ).toEqual({
      phone: "+258 84 000 0000",
      email: "ola@example.com",
      city: "Maputo",
    });
  });
  it("não cria links a partir de valores perigosos ou de JSON inválido", () => {
    expect(parsePublicContacts({ phone: "javascript:alert(1)" })).toBeNull();
    expect(
      parsePublicContacts({ email: "a@example.com?subject=forged" }),
    ).toBeNull();
    expect(parsePublicContacts(null)).toBeNull();
  });
});
