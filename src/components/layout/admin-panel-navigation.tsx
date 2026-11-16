"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutDashboard,
  MapPinned,
  MessageCircleMore,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: readonly NavItem[] };

const groups: readonly NavGroup[] = [
  {
    label: "Acesso público",
    items: [{ href: "/", label: "Home", icon: House }],
  },
  {
    label: "Painel",
    items: [{ href: "/admin", label: "Visão geral", icon: LayoutDashboard }],
  },
  {
    label: "Gestão do catálogo",
    items: [
      {
        href: "/admin/produtos",
        label: "Produtos e categorias",
        icon: Package,
      },
    ],
  },
  {
    label: "Operações",
    items: [
      {
        href: "/admin/apoio",
        label: "Atendimento",
        icon: MessageCircleMore,
      },
      { href: "/entrega", label: "Mapa de entregas", icon: MapPinned },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroups({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navegação de administração" className="grid gap-5">
      {groups.map((group) => (
        <div key={group.label} className="grid gap-1.5">
          {!collapsed ? (
            <p className="text-muted-foreground px-3 text-[11px] font-semibold tracking-[0.12em] uppercase">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                onClick={onNavigate}
                className={`group focus-visible:outline-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${collapsed ? "justify-center px-2" : ""} ${active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"}`}
              >
                <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                <span className={collapsed ? "sr-only" : "truncate"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminPanelNavigation({
  mobile = false,
  title = "Administração",
}: {
  mobile?: boolean;
  title?: string;
}) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (mobile) {
    const currentItem = groups
      .flatMap((group) => group.items)
      .find((item) => isActivePath(pathname, item.href));
    const CurrentIcon = currentItem?.icon ?? LayoutDashboard;

    return (
      <details
        open={mobileOpen}
        onToggle={(event) => setMobileOpen(event.currentTarget.open)}
        className="bg-card border-b px-4 py-2 md:hidden"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <CurrentIcon aria-hidden="true" className="text-primary size-4" />
          <span className="min-w-0 flex-1 truncate">
            {currentItem?.label ?? "Menu de administração"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          />
        </summary>
        <div className="pt-2 pb-1">
          <NavGroups
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </details>
    );
  }

  return (
    <aside
      className={`border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen shrink-0 flex-col border-r p-4 transition-[width] duration-200 md:flex ${collapsed ? "w-[5.25rem]" : "w-64"}`}
    >
      <div
        className={`flex min-h-16 items-center ${collapsed ? "justify-center" : "justify-between gap-2"}`}
      >
        <div
          className={`min-w-0 ${collapsed ? "[&_.brand-lockup-image]:size-10 [&_.brand-lockup>span]:hidden" : ""}`}
        >
          <Brand />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          onClick={() => setCollapsed((value) => !value)}
          className={
            collapsed ? "absolute top-20 left-1/2 -translate-x-1/2" : ""
          }
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" />
          ) : (
            <ChevronLeft aria-hidden="true" />
          )}
        </Button>
      </div>
      {!collapsed ? (
        <div className="mt-6 mb-5 border-b pb-4">
          <p className="text-muted-foreground text-xs">Área de trabalho</p>
          <p className="mt-1 truncate text-sm font-semibold">{title}</p>
        </div>
      ) : (
        <span className="sr-only">{title}</span>
      )}
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${collapsed ? "mt-12" : ""}`}
      >
        <NavGroups pathname={pathname} collapsed={collapsed} />
      </div>
      {!collapsed ? (
        <p className="text-muted-foreground mt-4 border-t pt-4 text-xs">
          Gestão da Agroconet
        </p>
      ) : null}
    </aside>
  );
}
