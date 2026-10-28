import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Globe2,
  Heart,
  Leaf,
  MapPin,
  Search,
  ShoppingBag,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import {
  ContactDetails,
  FooterAccountLinks,
  FooterContent,
} from "@/features/landing/public-footer";
import { CartStatus } from "@/features/cart/cart-status";
import { StorefrontAuthLinks } from "@/components/layout/storefront-auth-links";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getSiteLocale, type SiteLocale } from "@/lib/locale";

const getLinks = (locale: SiteLocale) => [
  { href: "/produtos", label: locale === "en" ? "Products" : "Produtos" },
  {
    href: "/#categorias",
    label: locale === "en" ? "Categories" : "Categorias",
  },
  {
    href: "/#como-funciona",
    label: locale === "en" ? "How it works" : "Como funciona",
  },
  {
    href: "/#vendedores",
    label: locale === "en" ? "For sellers" : "Para vendedores",
  },
];
export async function StorefrontShell({ children }: { children: ReactNode }) {
  const locale = await getSiteLocale();
  const links = getLinks(locale);
  return (
    <div className="storefront-frame">
      <a href="#conteudo" className="storefront-skip">
        {locale === "en" ? "Skip to content" : "Saltar para o conteúdo"}
      </a>
      <div className="guide-ribbon">
        <span className="inline-flex items-center gap-2">
          <Leaf aria-hidden="true" className="size-3" />{" "}
          {locale === "en"
            ? "NEW ENERGY FOR THE FIELD"
            : "UMA NOVA ENERGIA PARA O CAMPO"}
        </span>
        <Link
          prefetch={false}
          href="/#entregas"
          className="hidden sm:inline-flex"
        >
          {locale === "en"
            ? "Explore delivery areas"
            : "Conheça as zonas de entrega"}{" "}
          <ArrowUpRight aria-hidden="true" className="ml-2 size-3" />
        </Link>
      </div>
      <header className="storefront-header">
        <div className="storefront-navigation">
          <Brand />
          <form
            action="/produtos"
            role="search"
            aria-label={
              locale === "en" ? "Search the catalog" : "Pesquisar no catálogo"
            }
            className="storefront-header-search"
          >
            <Search aria-hidden="true" className="size-5" />
            <label htmlFor="storefront-search" className="sr-only">
              {locale === "en"
                ? "Search products, brands and categories"
                : "Pesquisar produtos, marcas e categorias"}
            </label>
            <input
              id="storefront-search"
              name="q"
              maxLength={100}
              placeholder={
                locale === "en"
                  ? "Search products, brands and categories"
                  : "Pesquisar produtos, marcas e categorias"
              }
            />
            <button
              type="submit"
              aria-label={locale === "en" ? "Search" : "Pesquisar"}
            >
              <Search aria-hidden="true" className="size-5" />
            </button>
          </form>
          <div className="storefront-locale">
            <Link href="/#entregas" prefetch={false}>
              <MapPin aria-hidden="true" className="size-4" />
              <span>
                <small>
                  {locale === "en" ? "Delivering to" : "Entrega em"}
                </small>
                <strong>Maputo e Matola</strong>
              </span>
            </Link>
            <span className="storefront-language-control">
              <Globe2 aria-hidden="true" className="size-4" />
              <LanguageSwitcher locale={locale} />
            </span>
          </div>
          <div className="storefront-account">
            <Suspense
              fallback={
                <Link
                  prefetch={false}
                  className="store-cart-link"
                  href="/carrinho"
                >
                  <ShoppingBag aria-hidden="true" className="size-5" />
                  <span>{locale === "en" ? "Cart" : "Carrinho"}</span>
                </Link>
              }
            >
              <CartStatus locale={locale} />
            </Suspense>
            <Link
              prefetch={false}
              className="store-favorites-link"
              href="/favoritos"
              aria-label={locale === "en" ? "Favorites" : "Favoritos"}
            >
              <Heart aria-hidden="true" className="size-5" />
              <span>{locale === "en" ? "Favorites" : "Favoritos"}</span>
            </Link>
            <Suspense
              fallback={
                <span className="store-auth-loading" aria-hidden="true" />
              }
            >
              <StorefrontAuthLinks links={links} locale={locale} />
            </Suspense>
          </div>
        </div>
        <div className="storefront-subnav">
          <nav
            aria-label={
              locale === "en" ? "Main navigation" : "Navegação principal"
            }
            className="desktop-store-nav"
          >
            {links.map((link) => (
              <Link prefetch={false} href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div id="conteudo" className="storefront-content">
        {children}
      </div>
      <FooterContent
        locale={locale}
        accountLinks={
          <Suspense fallback={null}>
            <FooterAccountLinks locale={locale} />
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
