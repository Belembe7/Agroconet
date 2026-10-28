import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasActiveRoute,
  pointFromSnapshot,
} from "@/features/delivery/route-types";
import { calculateRoadRoute } from "@/services/delivery/road-route";
afterEach(() => vi.unstubAllGlobals());
describe("Road routing", () => {
  it("does not turn missing coordinates into a location at zero", () => {
    expect(pointFromSnapshot({ latitude: null, longitude: null })).toBeNull();
    expect(pointFromSnapshot({ latitude: "", longitude: "32" })).toBeNull();
    expect(
      pointFromSnapshot({ latitude: "-25.96", longitude: "32.57" }),
    ).toEqual({ latitude: -25.96, longitude: 32.57 });
    expect(hasActiveRoute("DELIVERED")).toBe(false);
    expect(hasActiveRoute("CANCELLED")).toBe(false);
    expect(hasActiveRoute("EN_ROUTE_TO_CUSTOMER")).toBe(true);
  });
  it("reports no-road and provider failures without drawing a fabricated line", async () => {
    const origin = { latitude: -25.96, longitude: 32.57 };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "NoRoute" }),
      }),
    );
    await expect(calculateRoadRoute(origin, origin)).rejects.toMatchObject({
      status: 422,
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(calculateRoadRoute(origin, origin)).rejects.toMatchObject({
      status: 503,
    });
  });
});
