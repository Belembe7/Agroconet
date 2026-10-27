import { beforeEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimitStore } from "@/lib/rate-limit";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows up to max requests in the window", () => {
    const rule = { max: 3, windowMs: 60_000 };
    expect(consumeRateLimit("k", rule).allowed).toBe(true);
    expect(consumeRateLimit("k", rule).allowed).toBe(true);
    expect(consumeRateLimit("k", rule).allowed).toBe(true);
    const blocked = consumeRateLimit("k", rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates keys", () => {
    const rule = { max: 1, windowMs: 60_000 };
    expect(consumeRateLimit("a", rule).allowed).toBe(true);
    expect(consumeRateLimit("b", rule).allowed).toBe(true);
    expect(consumeRateLimit("a", rule).allowed).toBe(false);
  });
});
