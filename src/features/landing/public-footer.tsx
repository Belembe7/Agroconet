import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Brand } from "@/components/layout/brand";
import { getPublicContacts } from "@/features/landing/data";
import { getAppSession } from "@/lib/session";

async function ContactDetails() {
  await connection();
  let contacts;
  try {
    contacts = await getPublicContacts();
  } catch {
    return (
      <p className="text-muted-foreground text-sm">
        Contactos temporariamente indisponíveis. Tente novamente dentro de
        instantes.
      </p>
    );
  }
  if (!contacts || (!contacts.phone && !contacts.email && !contacts.city))
    return (
      <p className="text-muted-foreground text-sm">
        Os contactos estarão disponíveis em breve.
      </p>
    );
  return (
    <address className="public-contacts">
      {contacts.phone && (
        <a href={`tel:${contacts.phone.replace(/[^+0-9]/g, "")}`}>
          <Phone aria-hidden="true" />
          {contacts.phone}
        </a>
      )}
      {contacts.email && (
        <a href={`mailto:${contacts.email}`}>
          <Mail aria-hidden="true" />
          {contacts.email}
        </a>
      )}
      {contacts.city && (
        <p>
          <MapPin aria-hidden="true" />
          {contacts.city}
        </p>
      )}
    </address>
  );
}
export { ContactDetails };
export async function FooterAccountLinks({
  locale = "pt",
}: {
  locale?: "pt" | "en";
}) {
  const session = await getAppSession();
  if (!session) {
    return (
      <>
        <Link href="/registar">
          {locale === "en" ? "Create account" : "Criar conta"}{" "}
          <ArrowUpRight aria-hidden="true" className="size-3" />
        </Link>
        <Link href="/entrar">
          {locale === "en" ? "Sign in" : "Entrar na sua área"}
        </Link>
      </>
    );
  }

  const destination =
    session.actor.roles.includes("SUPER_ADMIN") ||
    session.actor.roles.includes("ADMIN")
      ? "/admin"
      : session.actor.roles.includes("SELLER")
        ? "/vendedor"
        : session.actor.roles.includes("DRIVER")
          ? "/entregador"
          : "/cliente";

  return (
    <>
      <Link href={destination}>
        {locale === "en" ? "My account" : "A minha conta"}
      </Link>
      {session.actor.roles.includes("CUSTOMER") ? (
        <Link href="/cliente/pedidos">
          {locale === "en" ? "My orders" : "Os meus pedidos"}
        </Link>
      ) : null}
    </>
  );
}

export function FooterContent({
  contacts,
  accountLinks,
  locale = "pt",
}: {
  contacts: React.ReactNode;
  accountLinks: React.ReactNode;
  locale?: "pt" | "en";
}) {
  return (
    <footer id="contactos" className="landing-footer">
      <section
        className="footer-updates"
        aria-labelledby="footer-updates-title"
      >
        <div className="footer-updates-copy">
          <p className="footer-updates-eyebrow">
            {locale === "en" ? "Agroconet" : "AGROCONET · MAPUTO E MATOLA"}
          </p>
          <h2 id="footer-updates-title">
            {locale === "en"
              ? "Everything your field needs, closer."
              : "Tudo para o campo, mais perto de si."}
          </h2>
          <p>
            {locale === "en"
              ? "Agricultural products from local sellers in Maputo and Matola."
              : "Produtos agropecuários de vendedores locais em Maputo e Matola."}
          </p>
        </div>
        <Link className="footer-updates-cta" href="/produtos">
          {locale === "en" ? "View catalogue" : "Ver catálogo"}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
      <div className="footer-grid">
        <div>
          <Brand />
          <p className="footer-manifesto">
            {locale === "en"
              ? "Agricultural supplies, closer to your field."
              : "Insumos agropecuários, mais perto do seu campo."}
            <br />
            {locale === "en"
              ? "A local marketplace for Maputo and Matola."
              : "Um marketplace local para Maputo e Matola."}
          </p>
        </div>
        <div>
          <h2>{locale === "en" ? "Explore" : "Explorar"}</h2>
          <Link href="/categorias">
            {locale === "en" ? "Categories" : "Categorias"}
          </Link>
          <Link href="/produtos">
            {locale === "en" ? "All products" : "Todos os produtos"}
          </Link>
          <Link href="/entrega">
            {locale === "en" ? "Delivery areas" : "Zonas de entrega"}
          </Link>
          <Link href="/favoritos">
            {locale === "en" ? "Favorites" : "Favoritos"}
          </Link>
          <Link href="/carrinho">
            {locale === "en" ? "Shopping cart" : "Carrinho de compras"}
          </Link>
        </div>
        <div>
          <h2>{locale === "en" ? "Agroconet" : "Agroconet"}</h2>
          <Link href="/sobre">{locale === "en" ? "About" : "Sobre"}</Link>
          <Link href="/como-funciona">
            {locale === "en" ? "How it works" : "Como funciona"}
          </Link>
          <Link href="/contactos">
            {locale === "en" ? "Contact" : "Contactos"}
          </Link>
          <h3>{locale === "en" ? "Account" : "Conta"}</h3>
          {accountLinks}
        </div>
        <div>
          <h2>{locale === "en" ? "Contact & support" : "Contactos e apoio"}</h2>
          {contacts}
          <Link href="/apoio">
            {locale === "en" ? "Open support" : "Abrir apoio"}
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © Agroconet · {locale === "en" ? "Mozambique" : "Moçambique"}
        </span>
        <span>
          {locale === "en"
            ? "Rooted in the land. Growing for the future."
            : "Da terra. Com futuro."}
        </span>
      </div>
    </footer>
  );
}
