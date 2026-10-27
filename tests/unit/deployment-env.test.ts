import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAppUrl, vercelTrustedOrigins } from "@/lib/deployment-url";

beforeEach(() => {
  vi.resetModules();
  for (const name of [
    "NEXT_PUBLIC_APP_URL",
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_VERCEL_ENV",
    "NEXT_PUBLIC_VERCEL_URL",
    "NEXT_PUBLIC_VERCEL_BRANCH_URL",
    "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
    "SKIP_ENV_VALIDATION",
  ]) {
    vi.stubEnv(name, undefined);
  }
  vi.stubEnv("DATABASE_URL", "postgresql://build:build@localhost:5432/build");
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "deployment-test-secret-of-at-least-32-characters",
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("deployment environment", () => {
  it("uses the production domain without manually configured app or auth URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "agroconet-build.vercel.app");
    vi.stubEnv(
      "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
      "agroconet.vercel.app",
    );

    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://agroconet.vercel.app");
    expect(env.BETTER_AUTH_URL).toBe("https://agroconet.vercel.app");
  });

  it("keeps preview links on the preview deployment", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "agroconet-preview.vercel.app");
    vi.stubEnv(
      "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
      "agroconet.vercel.app",
    );

    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_APP_URL).toBe(
      "https://agroconet-preview.vercel.app",
    );
    expect(env.BETTER_AUTH_URL).toBe(env.NEXT_PUBLIC_APP_URL);
  });

  it("preserves explicitly configured domains", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://loja.example.com");
    vi.stubEnv("BETTER_AUTH_URL", "https://conta.example.com");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "agroconet-preview.vercel.app");

    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://loja.example.com");
    expect(env.BETTER_AUTH_URL).toBe("https://conta.example.com");
  });

  it.each(["DATABASE_URL", "BETTER_AUTH_SECRET"])(
    "still rejects a deployment missing %s",
    async (name) => {
      vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "agroconet-preview.vercel.app");
      vi.stubEnv(name, undefined);
      await expect(import("@/lib/env")).rejects.toThrow(
        "Invalid environment variables",
      );
    },
  );

  it("does not invent a localhost or production URL when deployment configuration is missing", () => {
    expect(resolveAppUrl({})).toBeUndefined();
    expect(
      resolveAppUrl({
        environment: "preview",
        productionHost: "agroconet.vercel.app",
      }),
    ).toBeUndefined();
  });

  it("trusts exact deployment aliases without trusting production from a preview", () => {
    expect(
      vercelTrustedOrigins({
        environment: "preview",
        deploymentHost: "agroconet-preview.vercel.app",
        branchHost: "agroconet-git-preview.vercel.app",
        productionHost: "agroconet.vercel.app",
      }),
    ).toEqual([
      "https://agroconet-preview.vercel.app",
      "https://agroconet-git-preview.vercel.app",
    ]);
  });
});
