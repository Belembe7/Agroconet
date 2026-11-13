"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPinned,
  MessageCircleMore,
  Package,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Gerenciar Produtos", icon: Package },
  {
    href: "/admin/apoio",
    label: "Atendimento aos clientes",
    shortLabel: "Atendimento",
    icon: MessageCircleMore,
  },
  {
    href: "/entrega",
    label: "Mapa de entregas",
    shortLabel: "Mapa de entregas",
    icon: MapPinned,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminPanelNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";

  return (
    <nav
      aria-label={mobile ? "Navegação móvel" : "Navegação do painel"}
      className={
        mobile
          ? "bg-card flex gap-2 overflow-x-auto border-b px-4 md:hidden"
          : "grid gap-1"
      }
    >
      {links.map((link) => {
        const { href, label, icon: Icon } = link;
        const mobileLabel = "shortLabel" in link ? link.shortLabel : label;
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-t-lg px-3 text-sm ${active ? "text-primary border-primary border-b-2 font-medium" : "text-muted-foreground"}`
                : `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${active ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent/60"}`
            }
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {mobile ? mobileLabel : label}
          </Link>
        );
      })}
    </nav>
  );
}
