import { displayName } from "@/lib/display-name";

export type ProductImageAsset = {
  src: string;
};

const photo = (filename: string): ProductImageAsset => ({
  src: `/images/products/${filename}.png`,
});

// Only the eight seed packet photos supplied by the Agroconet team are used
// as built-in product photos. All other products wait for an admin upload.
const productImages: Record<string, ProductImageAsset> = {
  "semente cebola soli": photo("semente-cebola-soli"),
  "semente de cebola soli": photo("semente-cebola-soli"),
  "semente quiabo clemson spineless": photo(
    "semente-quiabo-clemson-spineless",
  ),
  "semente de quiabo clemson spineless": photo(
    "semente-quiabo-clemson-spineless",
  ),
  "semente melancia f1 thor": photo("semente-melancia-f1-thor"),
  "semente de melancia f1 thor": photo("semente-melancia-f1-thor"),
  "semente tomate f1 anaya": photo("semente-tomate-f1-anaya"),
  "semente de tomate f1 anaya": photo("semente-tomate-f1-anaya"),
  "semente beterraba crimson globe": photo(
    "semente-beterraba-crimson-globe",
  ),
  "semente de beterraba crimson globe": photo(
    "semente-beterraba-crimson-globe",
  ),
  "semente repolho red ball 2 f1": photo("semente-repolho-red-ball-2"),
  "semente de repolho red ball 2 f1": photo("semente-repolho-red-ball-2"),
  "semente cebola red creole": photo("semente-cebola-red-creole"),
  "semente de cebola red creole": photo("semente-cebola-red-creole"),
  "semente salsa comum": photo("semente-salsa-commun-2"),
  "semente de salsa comum": photo("semente-salsa-commun-2"),
};

function normalizeProductName(name: string) {
  return displayName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function productImageAsset(
  productName: string,
): ProductImageAsset | null {
  return productImages[normalizeProductName(productName)] ?? null;
}
