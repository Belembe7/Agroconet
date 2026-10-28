import { displayName } from "@/lib/display-name";

export function categoryImagePosition(categoryName: string): string | null {
  const category = displayName(categoryName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (category.includes("sement")) return "0% 0%";
  if (category.includes("fertiliz") || category.includes("solo"))
    return "50% 0%";
  if (
    category.includes("defens") ||
    category.includes("protec") ||
    category.includes("pesticid")
  )
    return "100% 0%";
  if (category.includes("ferrament") || category.includes("material agricola"))
    return "0% 100%";
  if (
    category.includes("cereal") ||
    category.includes("cereais") ||
    category.includes("racao") ||
    category.includes("nutri")
  )
    return "50% 100%";
  if (category.includes("irrig")) return "100% 100%";
  return null;
}

export function categoryImageUrl(categoryName: string): string | null {
  const category = displayName(categoryName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (category.includes("medicament") && category.includes("veterinar"))
    return "/images/medicamentos-veterinarios-category.webp";
  if (category.includes("repelent")) return "/images/repelente-category.webp";

  return null;
}
