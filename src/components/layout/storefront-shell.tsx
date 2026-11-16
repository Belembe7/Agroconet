import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Globe2 } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import {
  ContactDetails,
  FooterAccountLinks,
  FooterContent,
} from "@/features/landing/public-footer";
import { StorefrontAuthLinks } from "@/components/layout/storefront-auth-links";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PageBackButton } from "@/components/layout/page-back-button";
import { CartStatus, CartStatusFallback } from "@/features/cart/cart-status";
import { getSiteLocale, type SiteLocale } from "@/lib/locale";

const getLinks = (locale: SiteLocale) => [
  { href: "/", label: "Home" },
  { href: "/produtos", label: locale === "en" ? "Products" : "Produtos" },
  {
    href: "/como-funciona",
    label: locale === "en" ? "How it works" : "Como funciona",
  },
  {
    href: "/sobre",
    label: locale === "en" ? "About" : "Sobre",
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
      <header className="storefront-header">
        <div className="storefront-navigation">
          <Brand />
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
          <div className="storefront-actions">
            <span className="storefront-language-control">
              <Globe2 aria-hidden="true" className="size-4" />
              <LanguageSwitcher locale={locale} />
            </span>
            <ThemeToggle locale={locale} />
            <Suspense fallback={<CartStatusFallback locale={locale} />}>
              <CartStatus locale={locale} />
            </Suspense>
            <Suspense
              fallback={
                <span className="store-auth-loading" aria-hidden="true" />
              }
            >
              <StorefrontAuthLinks links={links} locale={locale} />
            </Suspense>
          </div>
        </div>
      </header>
      <div id="conteudo" className="storefront-content">
        <PageBackButton
          label={locale === "en" ? "Back" : "Voltar"}
          hideOnPrefixes={["/cliente"]}
        />
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
