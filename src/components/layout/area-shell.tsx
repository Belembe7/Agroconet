import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Store, Truck, UserRound } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { LogoutButton } from "@/features/auth/logout-button";
import { displayName } from "@/lib/display-name";

const areas = {
  admin: { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  vendedor: { href: "/vendedor", label: "O meu negócio", icon: Store },
  entregador: { href: "/entregador", label: "As minhas entregas", icon: Truck },
  cliente: { href: "/cliente", label: "A minha conta", icon: UserRound },
};
export function AreaShell({
  title,
  subtitle,
  userName,
  area,
  children,
}: {
  title: string;
  subtitle: string;
  userName: string;
  area: keyof typeof areas;
  children?: ReactNode;
}) {
  const item = areas[area];
  const Icon = item.icon;
  const panel = area === "admin" || area === "vendedor";
  return (
    <div className="bg-background flex min-h-screen flex-1">
      <a
        href="#area-conteudo"
        className="focus:bg-card sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:p-4"
      >
        Saltar para o conteúdo
      </a>
      {panel && (
        <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col border-r p-6 md:flex">
          <Brand />
          <p className="mt-10 mb-3 text-xs tracking-widest uppercase">
            {title}
          </p>
          <nav aria-label="Navegação do painel">
            <Link
              aria-current="page"
              href={item.href}
              className="bg-sidebar-accent flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm"
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          </nav>
          <Link
            href="/"
            className="mt-auto flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            Voltar à loja
          </Link>
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card border-b px-4 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-semibold">{title}</p>
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden max-w-48 truncate text-sm sm:inline">
                {displayName(userName)}
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>
        {panel && (
          <nav
            aria-label="Navegação móvel"
            className="bg-card border-b px-4 md:hidden"
          >
            <Link
              href={item.href}
              aria-current="page"
              className="inline-flex min-h-11 items-center gap-2 text-sm"
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
            <Link
              href="/"
              className="ml-6 inline-flex min-h-11 items-center text-sm underline"
            >
              Loja
            </Link>
          </nav>
        )}
        <main
          id="area-conteudo"
          className={`mx-auto w-full flex-1 px-4 py-8 sm:px-8 ${area === "entregador" ? "max-w-xl pb-28" : "max-w-6xl"}`}
        >
          {children}
        </main>
        {area === "entregador" && (
          <nav
            aria-label="Navegação do entregador"
            className="bg-card fixed inset-x-0 bottom-0 flex justify-around border-t px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          >
            <Link
              href="/entregador"
              aria-current="page"
              className="text-primary flex min-h-14 flex-col items-center justify-center gap-1 text-sm font-medium"
            >
              <Truck aria-hidden="true" className="size-5" />
              Entregas
            </Link>
            <Link
              href="/"
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-sm"
            >
              <Store aria-hidden="true" className="size-5" />
              Loja
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
