import { spawnSync } from "node:child_process";

const vercelEnvironment = process.env.VERCEL_ENV;
const shouldSeed =
  process.env.VERCEL === "1" &&
  ["preview", "production"].includes(vercelEnvironment ?? "");

if (!shouldSeed) {
  console.info("Skipping Vercel featured products seed outside a Vercel deploy.");
} else {
  const result = spawnSync("npm", ["run", "db:seed:featured-estimates"], {
    stdio: "inherit",
    env: {
      ...process.env,
      AGROCONET_LOAD_ESTIMATED_FEATURED: "1",
      AGROCONET_ALLOW_ESTIMATED_FEATURED_PRODUCTION:
        vercelEnvironment === "production" ? "1" : "0",
    },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
