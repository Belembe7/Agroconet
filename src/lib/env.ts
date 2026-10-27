import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { resolveAppUrl } from "@/lib/deployment-url";

const appUrl = resolveAppUrl({
  explicitUrl: process.env.NEXT_PUBLIC_APP_URL,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
  deploymentHost: process.env.NEXT_PUBLIC_VERCEL_URL,
  branchHost: process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
  productionHost: process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
});

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL?.trim() || appUrl,
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
