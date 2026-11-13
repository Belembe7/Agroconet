"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function AdminBackButton() {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  if (pathname === "/admin") return null;

  return (
    <Link
      href="/admin"
      className="hover:bg-muted focus-visible:ring-ring mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Voltar ao painel
    </Link>
  );
}
