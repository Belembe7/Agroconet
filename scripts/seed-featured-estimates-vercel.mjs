import { spawnSync } from "node:child_process";

const vercelEnvironment = process.env.VERCEL_ENV;
const shouldSeed =
  process.env.VERCEL === "1" &&
  process.env.AGROCONET_LOAD_ESTIMATED_FEATURED === "1" &&
  (vercelEnvironment === "preview" ||
    (vercelEnvironment === "production" &&
      process.env.AGROCONET_ALLOW_ESTIMATED_FEATURED_PRODUCTION === "1"));

if (!shouldSeed) {
  console.info(
    "Skipping estimated products; enable AGROCONET_LOAD_ESTIMATED_FEATURED=1 for Preview, and also AGROCONET_ALLOW_ESTIMATED_FEATURED_PRODUCTION=1 for Production.",
  );
} else {
  const result = spawnSync("npm", ["run", "db:seed:featured-estimates"], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
