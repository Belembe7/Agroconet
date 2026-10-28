"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LanguageSwitcher({ locale }: { locale: "pt" | "en" }) {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function changeLanguage(value: string) {
    const nextLocale = value === "en" ? "en" : "pt";
    document.cookie = `agroconet-locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    router.refresh();
  }

  return (
    <label className="storefront-language">
      <span className="sr-only">Language / Idioma</span>
      <select
        aria-label="Language / Idioma"
        value={locale}
        onChange={(event) => changeLanguage(event.target.value)}
      >
        <option value="pt">Português</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
