const productImageMappings = [
  ["kit horta", "/images/products/kit-horta-domestica.webp"],
  ["conector t", "/images/products/conector-t-irrigacao.webp"],
  ["tubo pvc", "/images/products/tubo-pvc-50-mm.webp"],
  ["racao peixe", "/images/products/racao-peixe-tilapia.webp"],
  ["pulverizador", "/images/products/pulverizador-16-l.webp"],
  ["oleo de neem", "/images/products/oleo-de-neem.webp"],
  ["semente couve", "/images/products/semente-couve.webp"],
  ["semente alface", "/images/products/semente-alface.webp"],
] as const;

function normalizeProductName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function productImageUrl(productName: string): string | null {
  const normalizedName = normalizeProductName(displayName(productName));
  return (
    productImageMappings.find(([keyword]) =>
      normalizedName.includes(keyword),
    )?.[1] ?? null
  );
}
import { displayName } from "@/lib/display-name";
