import { cookies } from "next/headers";

export type SiteLocale = "pt" | "en";

export async function getSiteLocale(): Promise<SiteLocale> {
  const locale = (await cookies()).get("agroconet-locale")?.value;
  return locale === "en" ? "en" : "pt";
}

export function localizeCategory(name: string, locale: SiteLocale) {
  if (locale === "pt") return name;

  const translations: Record<string, string> = {
    Sementes: "Seeds",
    Cereais: "Grains",
    Pesticidas: "Pesticides",
    Fertilizantes: "Fertilizers",
    Repelente: "Repellents",
    "Medicamentos veterinários": "Veterinary medicines",
    "Material agrícola": "Farm equipment",
  };

  return translations[name] ?? name;
}
