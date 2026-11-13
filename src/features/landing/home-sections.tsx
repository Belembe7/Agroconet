import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  MapPin,
  MessageCircle,
  PackageSearch,
  Sprout,
  Truck,
  UserRound,
} from "lucide-react";
import type { SiteLocale } from "@/lib/locale";
import { ScrollRevealGroup } from "@/features/landing/scroll-reveal-group";

export function LandingBenefits({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  const benefits = english
    ? [
        {
          icon: PackageSearch,
          title: "A practical catalogue",
          description: "Browse agricultural products in one place.",
        },
        {
          icon: BadgeCheck,
          title: "Approved sellers",
          description: "Products are shown by approved sellers.",
        },
        {
          icon: Truck,
          title: "Local delivery",
          description: "Coverage and timing are confirmed for your area.",
        },
        {
          icon: MessageCircle,
          title: "Nearby support",
          description: "Talk to our team when you need help.",
        },
      ]
    : [
        {
          icon: PackageSearch,
          title: "Um catálogo prático",
          description: "Explore produtos agropecuários num só lugar.",
        },
        {
          icon: BadgeCheck,
          title: "Vendedores aprovados",
          description: "Produtos publicados por vendedores aprovados.",
        },
        {
          icon: Truck,
          title: "Entrega local",
          description: "A cobertura e o prazo são confirmados para a sua zona.",
        },
        {
          icon: MessageCircle,
          title: "Apoio próximo",
          description: "Fale com a nossa equipa sempre que precisar.",
        },
      ];

  return (
    <section
      id="beneficios"
      className="agro-benefits"
      aria-label={english ? "Marketplace benefits" : "Vantagens do marketplace"}
    >
      <div className="agro-benefits-grid">
        {benefits.map(({ icon: Icon, title, description }) => (
          <article className="agro-benefit-card" key={title}>
            <span className="agro-benefit-icon" aria-hidden="true">
              <Icon className="size-5" strokeWidth={1.7} />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MarketplaceStory({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";

  return (
    <ScrollRevealGroup className="agro-story-reveal public-reveal-sequence">
      <section
        className="agro-story guide-section"
        aria-labelledby="agro-story-title"
      >
        <div className="agro-story-image" style={{ position: "relative" }}>
          <Image
            src="/images/agro-editorial.png"
            alt={
              english
                ? "Illustrative image of a grower in a field"
                : "Imagem ilustrativa de uma produtora no campo"
            }
            fill
            sizes="(max-width: 760px) 100vw, 48vw"
          />
          <span className="agro-image-caption">
            {english ? "ILLUSTRATIVE IMAGE" : "IMAGEM ILUSTRATIVA"}
          </span>
          <div className="agro-image-note">
            <LeafMark />
            <span>
              {english ? "Rooted in the land" : "Raízes ligadas à terra"}
            </span>
          </div>
        </div>

        <div className="agro-story-copy">
          <p className="agro-eyebrow">
            {english ? "ABOUT AGROCONET" : "SOBRE A AGROCONET"}
          </p>
          <h2 id="agro-story-title">
            {english ? "Closer to what helps" : "Mais perto do que ajuda"}
            <br />
            <em>{english ? "your field grow." : "o seu campo a crescer."}</em>
          </h2>
          <p className="agro-story-description">
            {english
              ? "Agroconet brings agricultural suppliers and buyers together in a multi-seller marketplace. Explore available options, ask questions and coordinate the next step with our team."
              : "A Agroconet aproxima fornecedores e compradores num marketplace multi-vendedor. Explore as opções disponíveis, esclareça dúvidas e combine o próximo passo com a nossa equipa."}
          </p>
          <Link href="/produtos" className="agro-text-link">
            {english ? "Explore the marketplace" : "Explorar o marketplace"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>

          <div className="agro-facts-grid">
            <div>
              <MapPin aria-hidden="true" />
              <strong>{english ? "Maputo & Matola" : "Maputo e Matola"}</strong>
              <span>
                {english ? "Local delivery areas" : "Zonas de entrega local"}
              </span>
            </div>
            <div>
              <Boxes aria-hidden="true" />
              <strong>{english ? "Multi-seller" : "Multi-vendedor"}</strong>
              <span>
                {english
                  ? "Products in one catalogue"
                  : "Produtos numa só montra"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </ScrollRevealGroup>
  );
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19.7 4.4C12 4 5.4 6.7 5.1 12.5c-.2 3.1 1.8 5.1 4.8 5 5.9-.3 8.1-6.8 9.8-13.1Z" />
      <path d="M3.9 20.1c2.1-4 5.5-7.1 10.2-9.5" />
    </svg>
  );
}

const marketplacePaths = [
  {
    category: "CATÁLOGO",
    title: "Explore produtos e marcas",
    description: "Pesquise no catálogo e compare as opções publicadas.",
    href: "/produtos",
    icon: PackageSearch,
  },
  {
    category: "CATEGORIAS",
    title: "Encontre por categoria",
    description: "Navegue por grupos de produtos disponíveis na montra.",
    href: "/#categorias",
    icon: Sprout,
  },
  {
    category: "ENTREGAS",
    title: "Consulte a cobertura local",
    description: "Veja as zonas activas e combine os detalhes da entrega.",
    href: "/entrega",
    icon: Truck,
  },
  {
    category: "APOIO",
    title: "Fale com a nossa equipa",
    description: "Esclareça dúvidas sobre produtos, disponibilidade ou compra.",
    href: "/apoio",
    icon: MessageCircle,
  },
  {
    category: "VENDEDORES",
    title: "Venda na Agroconet",
    description: "Conheça o processo para apresentar os seus produtos.",
    href: "/#vendedores",
    icon: BadgeCheck,
  },
  {
    category: "CONTA DE CLIENTE",
    title: "Crie a sua conta",
    description: "Aceda à sua área para acompanhar a experiência de compra.",
    href: "/registar",
    icon: UserRound,
  },
];

export function MarketplacePaths({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";

  return (
    <section
      id="explore"
      className="agro-paths guide-section"
      aria-labelledby="agro-paths-title"
    >
      <div className="section-topline agro-paths-heading">
        <div>
          <p className="agro-eyebrow">
            {english ? "YOUR NEXT STEP" : "O SEU PRÓXIMO PASSO"}
          </p>
          <h2 id="agro-paths-title">
            {english ? "Start with what you need." : "Comece pelo que precisa."}
          </h2>
        </div>
        <p className="section-side-note">
          {english
            ? "Useful paths to explore the marketplace, delivery and support."
            : "Atalhos úteis para explorar a montra, as entregas e o apoio."}
        </p>
      </div>
      <ScrollRevealGroup className="agro-paths-grid public-reveal-sequence">
        {marketplacePaths.map((path, index) => {
          const PathIcon = path.icon;
          return (
            <Link href={path.href} className="agro-path-card" key={path.title}>
              <div className="agro-path-image">
                <PathIcon aria-hidden="true" strokeWidth={1.4} />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="agro-path-copy">
                <p>
                  {english
                    ? translatePathCategory(path.category)
                    : path.category}
                </p>
                <h3>{english ? translatePathTitle(path.title) : path.title}</h3>
                <span>
                  {english ? translatePathAction(path.category) : "Saber mais"}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </ScrollRevealGroup>
    </section>
  );
}

function translatePathTitle(title: string) {
  const titles: Record<string, string> = {
    "Explore produtos e marcas": "Explore products and brands",
    "Encontre por categoria": "Browse by category",
    "Consulte a cobertura local": "Check local coverage",
    "Fale com a nossa equipa": "Talk to our team",
    "Venda na Agroconet": "Sell with Agroconet",
    "Crie a sua conta": "Create your account",
  };
  return titles[title] ?? title;
}

function translatePathCategory(category: string) {
  const categories: Record<string, string> = {
    CATÁLOGO: "CATALOGUE",
    CATEGORIAS: "CATEGORIES",
    ENTREGAS: "DELIVERY",
    APOIO: "SUPPORT",
    VENDEDORES: "SELLERS",
    "CONTA DE CLIENTE": "CUSTOMER ACCOUNT",
  };
  return categories[category] ?? category;
}

function translatePathAction(category: string) {
  if (category === "ENTREGAS") return "Plan a delivery";
  if (category === "APOIO") return "Get support";
  if (category === "VENDEDORES") return "Become a seller";
  if (category === "CONTA DE CLIENTE") return "Create account";
  return "Explore";
}

export function LandingContactPrompt({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";

  return (
    <section
      className="agro-contact-prompt"
      aria-labelledby="agro-contact-title"
    >
      <div className="agro-contact-decoration" aria-hidden="true">
        <LeafMark />
        <LeafMark />
        <LeafMark />
      </div>
      <div className="agro-contact-content">
        <p className="agro-eyebrow">
          {english ? "LET'S GROW TOGETHER" : "VAMOS CRESCER JUNTOS"}
        </p>
        <h2 id="agro-contact-title">
          {english
            ? "Questions about your next step?"
            : "Tem dúvidas sobre o próximo passo?"}
        </h2>
        <p>
          {english
            ? "Our team can help you understand the catalogue, delivery areas and seller process."
            : "A nossa equipa pode ajudar a conhecer o catálogo, as zonas de entrega e o processo para vendedores."}
        </p>
      </div>
      <Link href="/apoio" className="agro-button agro-button-dark">
        {english ? "Talk to Agroconet" : "Falar com a Agroconet"}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}
