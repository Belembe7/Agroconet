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
      <div className="footer-grid">
        <div>
          <Brand />
          <p className="footer-manifesto">
            {locale === "en"
              ? "We cultivate connections."
              : "Cultivamos ligações."}
            <br />
            {locale === "en"
              ? "We grow possibilities."
              : "Fazemos crescer possibilidades."}
          </p>
          <p className="footer-small">
            {locale === "en"
              ? "Agricultural solutions within reach."
              : "Soluções agropecuárias ao seu alcance."}
          </p>
        </div>
        <div>
          <h2>{locale === "en" ? "Explore" : "Explore"}</h2>
          <Link href="/#categorias">
            {locale === "en" ? "Categories" : "Categorias"}
          </Link>
          <Link href="/#destaques">
            {locale === "en" ? "Featured products" : "Produtos em destaque"}
          </Link>
          <Link href="/#como-funciona">
            {locale === "en" ? "How it works" : "Como funciona"}
          </Link>
          <Link href="/entrega">
            {locale === "en" ? "Plan delivery" : "Combinar entrega"}
          </Link>
          <Link href="/apoio">
            {locale === "en" ? "Support chat" : "Chat de apoio"}
          </Link>
        </div>
        <div>
          <h2>{locale === "en" ? "Join us" : "Faça parte"}</h2>
          {accountLinks}
          <Link href="/#vendedores">
            {locale === "en" ? "For sellers" : "Para vendedores"}
          </Link>
        </div>
        <div>
          <h2>{locale === "en" ? "Let's talk" : "Vamos conversar?"}</h2>
          {contacts}
        </div>
      </div>
      <div className="footer-bottom">
        <span>Agroconet · {locale === "en" ? "Mozambique" : "Moçambique"}</span>
        <span>
          {locale === "en"
            ? "Rooted in the land. Growing for the future."
            : "Da terra. Com futuro."}
        </span>
      </div>
    </footer>
  );
}
