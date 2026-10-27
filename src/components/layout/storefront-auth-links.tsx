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
}: {
  links: NavigationLink[];
}) {
  const session = await getAppSession();
  const destination = session ? accountPath(session.actor.roles) : null;
  const firstName = session?.user.name.trim().split(/\s+/)[0] || "Conta";
  const displayFirstName = `${firstName.slice(0, 1).toLocaleUpperCase("pt-MZ")}${firstName.slice(1)}`;

  return (
    <>
      {session ? (
        <>
          <Link
            prefetch={false}
            className="store-login store-account-link"
            href={destination!}
            aria-label={`Perfil de ${displayFirstName}`}
            title={session.user.name}
          >
            <span className="store-account-avatar" aria-hidden="true">
              <UserRound className="size-[18px]" />
            </span>
            <span className="store-account-copy">
              <span>Olá</span>
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
            Entrar
          </Link>
          <Link
            className="store-register hidden sm:inline-flex"
            href="/registar"
          >
            Criar conta <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </>
      )}
      <details className="mobile-store-menu">
        <summary aria-label="Menu de navegação">
          <Menu aria-hidden="true" className="size-5" />
        </summary>
        <nav aria-label="Navegação móvel">
          {links.map((link) => (
            <Link prefetch={false} key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link prefetch={false} href={destination!}>
                A minha conta · {displayFirstName}
              </Link>
              {session.actor.roles.includes("CUSTOMER") ? (
                <Link prefetch={false} href="/cliente/pedidos">
                  Os meus pedidos
                </Link>
              ) : null}
              <LogoutButton className="mobile-store-logout" />
            </>
          ) : (
            <>
              <Link prefetch={false} href="/registar">
                Criar conta
              </Link>
              <Link prefetch={false} href="/entrar">
                Entrar
              </Link>
            </>
          )}
          <Link prefetch={false} href="/favoritos">
            Favoritos
          </Link>
          <Link prefetch={false} href="/carrinho">
            Carrinho
          </Link>
          <Link prefetch={false} href="/#contactos">
            Contactos
          </Link>
        </nav>
      </details>
    </>
  );
}
