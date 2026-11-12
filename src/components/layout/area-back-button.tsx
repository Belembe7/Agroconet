"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function AreaBackButton({
  areaHomeHref,
  returnLabel,
}: {
  areaHomeHref: string;
  returnLabel: string;
}) {
  const pathname = usePathname();
  const currentPath = pathname.replace(/\/+$/, "") || "/";
  const areaHome = areaHomeHref.replace(/\/+$/, "") || "/";
  const isAreaHome = currentPath === areaHome;
  const parentPath = currentPath.slice(0, currentPath.lastIndexOf("/")) || "/";
  const parentIsInArea =
    parentPath === areaHome || parentPath.startsWith(`${areaHome}/`);
  const destination = isAreaHome ? "/" : parentIsInArea ? parentPath : areaHome;
  const label = isAreaHome
    ? "Voltar à loja"
    : destination === areaHome
      ? returnLabel
      : "Voltar";

  return (
    <Link
      href={destination}
      className="hover:bg-muted focus-visible:ring-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      aria-label={label}
      title={label}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
