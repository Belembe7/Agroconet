import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Heart, Leaf, ShoppingBag } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import {
  ContactDetails,
  FooterAccountLinks,
  FooterContent,
} from "@/features/landing/public-footer";
import { CartStatus } from "@/features/cart/cart-status";
import { StorefrontAuthLinks } from "@/components/layout/storefront-auth-links";

const links = [
  { href: "/produtos", label: "Produtos" },
  { href: "/#categorias", label: "Categorias" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#vendedores", label: "Para vendedores" },
];
export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="storefront-frame">
      <a href="#conteudo" className="storefront-skip">
        Saltar para o conteúdo
      </a>
      <div className="guide-ribbon">
        <span className="inline-flex items-center gap-2">
          <Leaf aria-hidden="true" className="size-3" /> UMA NOVA ENERGIA PARA O
          CAMPO
        </span>
        <Link
          prefetch={false}
          href="/#entregas"
          className="hidden sm:inline-flex"
        >
          Conheça as zonas de entrega{" "}
          <ArrowUpRight aria-hidden="true" className="ml-2 size-3" />
        </Link>
      </div>
      <header className="storefront-header">
        <div className="storefront-navigation">
          <Brand />
          <nav aria-label="Navegação principal" className="desktop-store-nav">
            {links.map((link) => (
              <Link prefetch={false} href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="storefront-account">
            <Suspense
              fallback={
                <Link
                  prefetch={false}
                  className="store-cart-link"
                  href="/carrinho"
                >
                  <ShoppingBag aria-hidden="true" className="size-5" />
                  <span>Carrinho</span>
                </Link>
              }
            >
              <CartStatus />
            </Suspense>
            <Link
              prefetch={false}
              className="store-favorites-link"
              href="/favoritos"
              aria-label="Favoritos"
            >
              <Heart aria-hidden="true" className="size-5" />
              <span>Favoritos</span>
            </Link>
            <Suspense
              fallback={
                <span className="store-auth-loading" aria-hidden="true" />
              }
            >
              <StorefrontAuthLinks links={links} />
            </Suspense>
          </div>
        </div>
      </header>
      <div id="conteudo" className="storefront-content">
        {children}
      </div>
      <FooterContent
        accountLinks={
          <Suspense fallback={null}>
            <FooterAccountLinks />
          </Suspense>
        }
        contacts={
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm">
                A carregar contactos…
              </p>
            }
          >
            <ContactDetails />
          </Suspense>
        }
      />
    </div>
  );
}
