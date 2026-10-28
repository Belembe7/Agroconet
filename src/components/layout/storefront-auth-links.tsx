import Link from "next/link";
import { ArrowUpRight, Menu, UserRound } from "lucide-react";
import { LogoutButton } from "@/features/auth/logout-button";
import { getAppSession } from "@/lib/session";

type NavigationLink = { href: string; label: string };

function accountPath(roles: string[]) {
  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) return "/admin";
  if (roles.includes("SELLER")) return "/vendedor";
  if (roles.includes("DRIVER")) return "/entregador";
  return "/cliente";
}

export async function StorefrontAuthLinks({
  links,
  locale,
}: {
  links: NavigationLink[];
  locale: "pt" | "en";
}) {
  const session = await getAppSession();
  const destination = session ? accountPath(session.actor.roles) : null;
  const firstName =
    session?.user.name.trim().split(/\s+/)[0] ||
    (locale === "en" ? "Account" : "Conta");
  const displayFirstName = `${firstName.slice(0, 1).toLocaleUpperCase("pt-MZ")}${firstName.slice(1)}`;

  return (
    <>
      {session ? (
        <>
          <Link
            prefetch={false}
            className="store-login store-account-link"
            href={destination!}
            aria-label={`${locale === "en" ? "Profile of" : "Perfil de"} ${displayFirstName}`}
            title={session.user.name}
          >
            <span className="store-account-avatar" aria-hidden="true">
              <UserRound className="size-[18px]" />
            </span>
            <span className="store-account-copy">
              <span>{locale === "en" ? "Hello" : "Olá"}</span>
              <strong>{displayFirstName}</strong>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="store-account-arrow size-3.5"
            />
          </Link>
          <LogoutButton className="store-login store-logout-button" />
        </>
      ) : (
        <>
          <Link prefetch={false} className="store-login" href="/entrar">
            {locale === "en" ? "Sign in" : "Entrar"}
          </Link>
          <Link
            className="store-register hidden sm:inline-flex"
            href="/registar"
          >
            {locale === "en" ? "Create account" : "Criar conta"}{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </>
      )}
      <details className="mobile-store-menu">
        <summary
          aria-label={locale === "en" ? "Navigation menu" : "Menu de navegação"}
        >
          <Menu aria-hidden="true" className="size-5" />
        </summary>
        <nav
          aria-label={locale === "en" ? "Mobile navigation" : "Navegação móvel"}
        >
          {links.map((link) => (
            <Link prefetch={false} key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link prefetch={false} href={destination!}>
                {locale === "en" ? "My account" : "A minha conta"} ·{" "}
                {displayFirstName}
              </Link>
              {session.actor.roles.includes("CUSTOMER") ? (
                <Link prefetch={false} href="/cliente/pedidos">
                  {locale === "en" ? "My orders" : "Os meus pedidos"}
                </Link>
              ) : null}
              <LogoutButton className="mobile-store-logout" />
            </>
          ) : (
            <>
              <Link prefetch={false} href="/registar">
                {locale === "en" ? "Create account" : "Criar conta"}
              </Link>
              <Link prefetch={false} href="/entrar">
                {locale === "en" ? "Sign in" : "Entrar"}
              </Link>
            </>
          )}
          <Link prefetch={false} href="/favoritos">
            {locale === "en" ? "Favorites" : "Favoritos"}
          </Link>
          <Link prefetch={false} href="/carrinho">
            {locale === "en" ? "Cart" : "Carrinho"}
          </Link>
          <Link prefetch={false} href="/#contactos">
            {locale === "en" ? "Contact" : "Contactos"}
          </Link>
        </nav>
      </details>
    </>
  );
}
