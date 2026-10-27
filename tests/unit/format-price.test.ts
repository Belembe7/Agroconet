import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("converte centavos para MZN sem perder a parte decimal", () => {
    const expected = new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
    });
    expect(formatPrice(125050)).toBe(expected.format(1250.5));
    expect(formatPrice(1)).toBe(expected.format(0.01));
    expect(formatPrice(0)).toBe(expected.format(0));
  });
  it("rejeita montantes que não sejam inteiros seguros", () => {
    for (const amount of [1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => formatPrice(amount)).toThrow(RangeError);
    }
  });
});
