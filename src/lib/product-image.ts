import { displayName } from "@/lib/display-name";

type TilePosition = "0% 0%" | "100% 0%" | "0% 100%" | "100% 100%";

export type ProductImageAsset = {
  src: string;
  position?: TilePosition;
};

const tile = (sheet: number, position: TilePosition): ProductImageAsset => ({
  src: `/images/products/product-sheet-${sheet}.webp`,
  position,
});

const photo = (filename: string): ProductImageAsset => ({
  src: `/images/products/${filename}.webp`,
});

// Each entry points to a distinct product photograph or a distinct sheet tile.
const productImages: Record<string, ProductImageAsset> = {
  "npk 12-24-12": tile(1, "0% 0%"),
  "ureia 46%": tile(1, "100% 0%"),
  "map 11-52-0": tile(1, "0% 100%"),
  "sulfato de amonio": tile(1, "100% 100%"),
  "composto organico": tile(2, "0% 0%"),
  "calcario agricola": tile(2, "100% 0%"),
  "esterco curtido": tile(2, "0% 100%"),
  "semente milho hibrido": tile(2, "100% 100%"),
  "semente arroz ir64": tile(3, "0% 0%"),
  "semente feijao boer": tile(3, "100% 0%"),
  "semente tomate hibrido": tile(3, "0% 100%"),
  "semente cebola": tile(3, "100% 100%"),
  "herbicida glifosato": tile(4, "0% 0%"),
  "inseticida cipermetrina": tile(4, "100% 0%"),
  "fungicida mancozeb": tile(4, "0% 100%"),
  "enxofre molhavel": tile(4, "100% 100%"),
  "armadilha feromona": tile(5, "0% 0%"),
  "enxada forjada": tile(5, "100% 0%"),
  "pa de corte": tile(5, "0% 100%"),
  "regador 10 l": tile(5, "100% 100%"),
  "tesoura de poda": tile(6, "0% 0%"),
  "carrinho de mao": tile(6, "100% 0%"),
  "racao frango crescimento": tile(6, "0% 100%"),
  "racao postura": tile(6, "100% 100%"),
  "sal mineral bovino": tile(7, "0% 0%"),
  "premix vitaminico": tile(7, "100% 0%"),
  "farelo de soja": tile(7, "0% 100%"),
  'mangueira irrigacao 1"': tile(7, "100% 100%"),
  "gotejador 2 l/h": tile(8, "0% 0%"),
  "filtro de disco": tile(8, "100% 0%"),
  "bomba centrifuga 1 hp": tile(8, "0% 100%"),
  "aspersor circular": tile(8, "100% 100%"),
  "kit horta domestica": photo("kit-horta-domestica"),
  "conector t irrigacao": photo("conector-t-irrigacao"),
  "tubo pvc 50 mm": photo("tubo-pvc-50-mm"),
  "racao peixe tilapia": photo("racao-peixe-tilapia"),
  "pulverizador 16 l": photo("pulverizador-16-l"),
  "oleo de neem": photo("oleo-de-neem"),
  "semente couve": photo("semente-couve"),
  "semente alface": photo("semente-alface"),
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
