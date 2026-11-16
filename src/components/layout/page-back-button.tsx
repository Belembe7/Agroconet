"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

function getParentPath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "/";

  if (path === "/checkout") return "/carrinho";
  if (path === "/registar" || path === "/recuperar" || path === "/redefinir") {
    return "/entrar";
  }

  const parent = path.slice(0, path.lastIndexOf("/"));
  return parent || "/";
}

export function PageBackButton({
  fallbackHref,
  hideOnPrefixes = [],
  label = "Voltar",
  className,
  containerClassName = "mx-auto w-full max-w-6xl px-4 pt-4 sm:px-8",
}: {
  fallbackHref?: string;
  hideOnPrefixes?: string[];
  label?: string;
  className?: string;
  containerClassName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (
    !pathname ||
    pathname === "/" ||
    hideOnPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }

  function goBack() {
    const cameFromThisSite = (() => {
      try {
        return (
          document.referrer !== "" &&
          new URL(document.referrer).origin === window.location.origin
        );
      } catch {
        return false;
      }
    })();

    if (cameFromThisSite && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref ?? getParentPath(pathname));
  }

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={goBack}
        className={
          className ??
          "hover:bg-muted focus-visible:ring-ring inline-flex min-h-10 items-center gap-2 rounded-full border bg-background px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        }
        aria-label={label}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        <span>{label}</span>
      </button>
    </div>
  );
}
