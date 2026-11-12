"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ locale = "pt" }: { locale?: "pt" | "en" }) {
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const dark = mounted && resolvedTheme === "dark";
  const nextTheme = dark ? "light" : "dark";
  const label = dark
    ? locale === "en"
      ? "light"
      : "claro"
    : locale === "en"
      ? "dark"
      : "escuro";

  return (
    <button
      type="button"
      className="farmbity-theme-toggle border-border bg-background text-foreground hover:bg-muted inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors"
      aria-label={
        locale === "en"
          ? `Switch to ${label} theme`
          : `Mudar para o tema ${label}`
      }
      title={
        locale === "en"
          ? `Switch to ${label} theme`
          : `Mudar para o tema ${label}`
      }
      onClick={() => setTheme(nextTheme)}
    >
      {dark ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
