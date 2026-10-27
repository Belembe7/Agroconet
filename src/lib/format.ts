import { siteConfig } from "@/config/site";

const amount = new Intl.NumberFormat(siteConfig.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number) {
  if (!Number.isSafeInteger(cents))
    throw new RangeError("O preço deve ser um inteiro seguro em centavos.");
  return `${amount.format(cents / 100)} Mzn`;
}
