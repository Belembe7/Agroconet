type VercelUrls = {
  environment?: string;
  deploymentHost?: string;
  branchHost?: string;
  productionHost?: string;
};

function hostOrigin(host: string | undefined) {
  const value = host?.trim();
  return value ? new URL(`https://${value}`).origin : undefined;
}

export function resolveAppUrl({
  explicitUrl,
  environment,
  deploymentHost,
  branchHost,
  productionHost,
}: VercelUrls & { explicitUrl?: string }) {
  if (explicitUrl?.trim()) return explicitUrl.trim();

  const host =
    environment === "production"
      ? productionHost?.trim() || deploymentHost?.trim()
      : deploymentHost?.trim() || branchHost?.trim();

  return hostOrigin(host);
}

export function vercelTrustedOrigins({
  environment,
  deploymentHost,
  branchHost,
  productionHost,
}: VercelUrls) {
  const hosts = [deploymentHost, branchHost];
  if (environment === "production") hosts.push(productionHost);

  return [...new Set(hosts.map(hostOrigin).filter((url) => url !== undefined))];
}
