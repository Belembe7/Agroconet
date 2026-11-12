import { siteConfig } from "@/config/site";

const amount = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  currencyDisplay: "code",
});

export function formatPrice(cents: number) {
  if (!Number.isSafeInteger(cents))
    throw new RangeError("O preço deve ser um inteiro seguro em centavos.");
  const formatted = amount.format(cents / 100);
  return siteConfig.currency === "MZN"
    ? formatted.replaceAll("MZN", "MZn")
    : formatted;
}
