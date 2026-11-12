import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  ClipboardList,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContactDetails } from "@/features/landing/public-footer";
import { ProcessCardSequence } from "@/features/landing/process-card-sequence";
import { siteConfig } from "@/config/site";
import type { SiteLocale } from "@/lib/locale";

type Step = { title: string; description: string; icon: LucideIcon };

function ImageHero({
  eyebrow,
  title,
  description,
  locale,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  locale: SiteLocale;
}) {
  const english = locale === "en";
  return (
    <section className="farm-public-hero" aria-label={eyebrow}>
      <Image
        src="/images/agro-editorial.png"
        alt={
          english
            ? "Illustrative agricultural landscape"
            : "Paisagem agrícola ilustrativa"
        }
        fill
        priority
        sizes="100vw"
        className="farm-public-hero-image"
      />
      <div className="farm-public-hero-shade" aria-hidden="true" />
      <div className="farm-public-hero-copy">
        <p className="farm-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="farm-public-hero-description">{description}</p>
        <div className="farm-public-actions">
          <Link className="farm-button farm-button-primary" href="/produtos">
            {english ? "Browse products" : "Explorar produtos"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          <Link className="farm-button farm-button-outline" href="/registar">
            {english ? "Create an account" : "Criar conta"}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeProcess({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  const steps: Step[] = english
    ? [
        {
          icon: UserRound,
          title: "Create an account",
          description: "Set up your customer account and delivery address.",
        },
        {
          icon: Search,
          title: "Explore the catalogue",
          description: "Compare product details, sellers, prices and stock.",
        },
        {
          icon: ShoppingBasket,
          title: "Submit your order",
          description: "Choose quantities, an address and payment on delivery.",
        },
        {
          icon: Truck,
          title: "Follow the delivery",
          description: "Track order progress as it moves through delivery.",
        },
      ]
    : [
        {
          icon: UserRound,
          title: "Crie a sua conta",
          description: "Prepare a conta de cliente e a sua morada de entrega.",
        },
        {
          icon: Search,
          title: "Explore o catálogo",
          description:
            "Compare produtos, vendedores, preços e disponibilidade.",
        },
        {
          icon: ShoppingBasket,
          title: "Submeta o pedido",
          description: "Escolha quantidades, morada e pagamento na entrega.",
        },
        {
          icon: Truck,
          title: "Acompanhe a entrega",
          description: "Consulte o progresso do pedido durante a entrega.",
        },
      ];

  return (
    <section
      className="farm-process-section"
      aria-labelledby="home-process-title"
    >
      <div className="farm-section-heading">
        <div>
          <p className="farm-eyebrow">
            {english ? "A CLEAR PROCESS" : "UM PROCESSO CLARO"}
          </p>
          <h2 id="home-process-title">
            {english ? "From catalogue to delivery" : "Do catálogo à entrega"}
          </h2>
        </div>
        <Link className="farm-inline-link" href="/como-funciona">
          {english ? "See how it works" : "Veja como funciona"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <ProcessCardSequence>
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li className="farm-process-card" key={title}>
            <div className="farm-process-card-top">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ProcessCardSequence>
    </section>
  );
}

export function MarketplaceRoles({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  const roles = english
    ? [
        {
          icon: Store,
          title: "For sellers",
          description:
            "Approved sellers publish products, update stock and manage incoming orders.",
          action: "Contact our team",
          href: "/apoio",
        },
        {
          icon: ShoppingBasket,
          title: "For customers",
          description:
            "Browse the catalogue, place orders and follow their status from your account.",
          action: "Browse products",
          href: "/produtos",
        },
        {
          icon: Truck,
          title: "For delivery drivers",
          description:
            "Approved drivers manage assigned deliveries and update each delivery stage.",
          action: "Contact our team",
          href: "/contactos",
        },
      ]
    : [
        {
          icon: Store,
          title: "Para vendedores",
          description:
            "Vendedores aprovados publicam produtos, actualizam stock e gerem pedidos.",
          action: "Falar com a equipa",
          href: "/apoio",
        },
        {
          icon: ShoppingBasket,
          title: "Para clientes",
          description:
            "Explore o catálogo, submeta pedidos e acompanhe o estado na sua conta.",
          action: "Explorar produtos",
          href: "/produtos",
        },
        {
          icon: Truck,
          title: "Para entregadores",
          description:
            "Entregadores aprovados gerem entregas atribuídas e actualizam cada etapa.",
          action: "Falar com a equipa",
          href: "/contactos",
        },
      ];

  return (
    <section
      className="farm-roles-section"
      id="perfis"
      aria-labelledby="farm-roles-title"
    >
      <div className="farm-section-heading">
        <div>
          <p className="farm-eyebrow">
            {english
              ? "MADE FOR LOCAL AGRICULTURE"
              : "FEITO PARA A AGRICULTURA LOCAL"}
          </p>
          <h2 id="farm-roles-title">
            {english
              ? "One marketplace, clear roles"
              : "Um marketplace, vários perfis"}
          </h2>
        </div>
        <Link className="farm-inline-link" href="/como-funciona#perfis">
          {english ? "Learn about each role" : "Conheça cada perfil"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="farm-role-grid">
        {roles.map(({ icon: Icon, ...role }) => (
          <article className="farm-role-card" key={role.title}>
            <span className="farm-role-icon">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <h3>{role.title}</h3>
            <p>{role.description}</p>
            <Link href={role.href}>
              {role.action}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HowItWorksPage({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  const journey: Step[] = english
    ? [
        {
          icon: UserRound,
          title: "Create your account",
          description:
            "Create a customer account to order. Seller and driver access is reviewed by the Agroconet team.",
        },
        {
          icon: Boxes,
          title: "Publish available products",
          description:
            "Approved sellers add product details, prices, variants and available stock to their catalogue.",
        },
        {
          icon: Search,
          title: "Compare catalogue options",
          description:
            "Search and filter by product or category, then review price, seller and stock information.",
        },
        {
          icon: ShoppingBasket,
          title: "Build your cart",
          description:
            "Select product variants and quantities, then continue to checkout with your chosen items.",
        },
        {
          icon: ClipboardList,
          title: "Submit an order",
          description:
            "Choose a saved delivery address and submit the order with payment on delivery.",
        },
        {
          icon: BadgeCheck,
          title: "Seller confirms the order",
          description:
            "The seller confirms or rejects the request, then marks confirmed items ready for collection.",
        },
        {
          icon: Truck,
          title: "Follow delivery progress",
          description:
            "An assigned driver updates the collection and delivery stages in the delivery workflow.",
        },
        {
          icon: PackageCheck,
          title: "Confirm delivery",
          description:
            "The driver completes delivery with the order confirmation code and the order status is updated.",
        },
      ]
    : [
        {
          icon: UserRound,
          title: "Crie a sua conta",
          description:
            "Crie uma conta de cliente para comprar. O acesso de vendedores e entregadores é analisado pela equipa Agroconet.",
        },
        {
          icon: Boxes,
          title: "Publique produtos disponíveis",
          description:
            "Vendedores aprovados acrescentam detalhes, preços, variantes e stock disponível ao catálogo.",
        },
        {
          icon: Search,
          title: "Compare opções do catálogo",
          description:
            "Pesquise e filtre por produto ou categoria; consulte preços, vendedor e disponibilidade.",
        },
        {
          icon: ShoppingBasket,
          title: "Prepare o carrinho",
          description:
            "Escolha variantes e quantidades dos produtos e avance para finalizar o pedido.",
        },
        {
          icon: ClipboardList,
          title: "Submeta um pedido",
          description:
            "Escolha uma morada guardada e submeta o pedido com pagamento na entrega.",
        },
        {
          icon: BadgeCheck,
          title: "O vendedor confirma o pedido",
          description:
            "O vendedor confirma ou recusa o pedido e marca os artigos confirmados como prontos para recolha.",
        },
        {
          icon: Truck,
          title: "Acompanhe o progresso da entrega",
          description:
            "Um entregador atribuído actualiza as etapas de recolha e entrega no sistema.",
        },
        {
          icon: PackageCheck,
          title: "Confirme a entrega",
          description:
            "O entregador conclui a entrega com o código de confirmação e o estado do pedido é actualizado.",
        },
      ];

  const profiles = english
    ? [
        {
          id: "vendedores",
          number: "01",
          title: "For sellers",
          copy: "Keep product information and stock up to date, review order requests and prepare confirmed items for collection.",
          icon: Store,
          href: "/apoio",
          action: "Ask about joining",
        },
        {
          id: "clientes",
          number: "02",
          title: "For customers",
          copy: "Compare listed products, add the quantities you need, submit an order and check delivery progress from your account.",
          icon: UserRound,
          href: "/produtos",
          action: "Browse products",
        },
        {
          id: "entregadores",
          number: "03",
          title: "For delivery drivers",
          copy: "Approved drivers manage assigned deliveries, update status and enter the confirmation code to complete delivery.",
          icon: Truck,
          href: "/contactos",
          action: "Contact Agroconet",
        },
      ]
    : [
        {
          id: "vendedores",
          number: "01",
          title: "Para vendedores",
          copy: "Mantenha produtos e stock actualizados, reveja pedidos e prepare os artigos confirmados para recolha.",
          icon: Store,
          href: "/apoio",
          action: "Saiba como participar",
        },
        {
          id: "clientes",
          number: "02",
          title: "Para clientes",
          copy: "Compare produtos publicados, escolha quantidades, submeta pedidos e consulte o progresso da entrega na sua conta.",
          icon: UserRound,
          href: "/produtos",
          action: "Explorar produtos",
        },
        {
          id: "entregadores",
          number: "03",
          title: "Para entregadores",
          copy: "Entregadores aprovados gerem entregas atribuídas, actualizam o estado e introduzem o código para concluir a entrega.",
          icon: Truck,
          href: "/contactos",
          action: "Contactar a Agroconet",
        },
      ];

  return (
    <main className="farm-public-page farm-how-page">
      <ImageHero
        locale={locale}
        eyebrow={english ? "HOW AGROCONET WORKS" : "COMO FUNCIONA A AGROCONET"}
        title={
          english ? (
            <>A clear journey from catalogue to delivery</>
          ) : (
            <>Um percurso claro do catálogo à entrega</>
          )
        }
        description={
          english
            ? "Find agricultural supplies, place an order and follow the delivery stages in one local marketplace."
            : "Encontre insumos agropecuários, submeta um pedido e acompanhe as etapas de entrega num marketplace local."
        }
      />

      <nav
        className="farm-anchor-nav"
        aria-label={english ? "Page sections" : "Secções da página"}
      >
        <a href="#vendedores">{english ? "For sellers" : "Para vendedores"}</a>
        <a href="#clientes">{english ? "For customers" : "Para clientes"}</a>
        <a href="#entregadores">
          {english ? "For drivers" : "Para entregadores"}
        </a>
        <a href="#percurso">
          {english ? "Order journey" : "Percurso do pedido"}
        </a>
      </nav>

      <section
        id="percurso"
        className="farm-public-section farm-journey-section"
      >
        <div className="farm-section-heading farm-section-heading-copy">
          <div>
            <p className="farm-eyebrow">
              {english ? "ORDER JOURNEY" : "PERCURSO DO PEDIDO"}
            </p>
            <h2>{english ? "Eight clear stages" : "Oito etapas claras"}</h2>
          </div>
          <p>
            {english
              ? "The controls available at each stage depend on your account role and the current order status."
              : "As acções disponíveis em cada etapa dependem do seu perfil e do estado actual do pedido."}
          </p>
        </div>
        <ol className="farm-journey-grid">
          {journey.map(({ icon: Icon, title, description }, index) => (
            <li className="farm-journey-card" key={title}>
              <span className="farm-journey-icon">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="farm-journey-copy">
                <p className="farm-journey-step">
                  {english ? "STEP" : "ETAPA"} {index + 1}
                </p>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="farm-profiles-section"
        aria-label={english ? "Marketplace roles" : "Perfis do marketplace"}
      >
        <div className="farm-public-section farm-profile-list">
          {profiles.map(({ icon: Icon, ...profile }) => (
            <article
              className="farm-profile-row"
              id={profile.id}
              key={profile.id}
            >
              <div className="farm-profile-row-index">
                <span>{profile.number}</span>
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="farm-eyebrow">
                  {english
                    ? `0${Number(profile.number)} / AGROCONET ROLE`
                    : `0${Number(profile.number)} / PERFIL AGROCONET`}
                </p>
                <h2>{profile.title}</h2>
                <p className="farm-profile-copy">{profile.copy}</p>
              </div>
              <Link
                className="farm-inline-link farm-profile-action"
                href={profile.href}
              >
                {profile.action}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        id="orientacoes"
        className="farm-public-section farm-advice-section"
      >
        <div className="farm-section-heading farm-section-heading-copy">
          <div>
            <p className="farm-eyebrow">
              {english ? "PRACTICAL GUIDANCE" : "RECOMENDAÇÕES PRÁTICAS"}
            </p>
            <h2>
              {english ? "A few useful reminders" : "Alguns lembretes úteis"}
            </h2>
          </div>
        </div>
        <div className="farm-advice-grid">
          <article>
            <MapPin aria-hidden="true" />
            <h3>
              {english ? "Use a current address" : "Use uma morada actualizada"}
            </h3>
            <p>
              {english
                ? "Check your delivery address before submitting an order."
                : "Confirme a morada de entrega antes de submeter um pedido."}
            </p>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" />
            <h3>
              {english
                ? "Keep order updates together"
                : "Mantenha os passos no pedido"}
            </h3>
            <p>
              {english
                ? "Check status and delivery updates in your Agroconet account so everyone can follow the same order."
                : "Consulte o estado e as actualizações de entrega na sua conta Agroconet para manter o histórico do pedido acessível."}
            </p>
          </article>
        </div>
        <Link
          className="farm-button farm-button-primary farm-advice-cta"
          href="/apoio"
        >
          {english ? "Open support" : "Abrir apoio"}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
    </main>
  );
}

export function AboutPage({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  const roles = english
    ? [
        ["Customers", "Browse products, place orders and track delivery."],
        [
          "Sellers",
          "Publish agricultural supplies and manage stock and orders.",
        ],
        ["Delivery drivers", "Handle assigned deliveries and update progress."],
      ]
    : [
        ["Clientes", "Explore produtos, submeta pedidos e acompanhe entregas."],
        [
          "Vendedores",
          "Publique insumos agropecuários e gira stock e pedidos.",
        ],
        [
          "Entregadores",
          "Faça entregas atribuídas e actualize o seu progresso.",
        ],
      ];
  const principles = english
    ? [
        [
          "Clear product information",
          "Compare listed details, seller, price and available stock before ordering.",
        ],
        [
          "Order visibility",
          "Follow seller confirmation and delivery progress through your account.",
        ],
        [
          "Local delivery",
          "Coordinate delivery in Maputo and Matola based on active coverage and order details.",
        ],
        [
          "Support when needed",
          "Reach the Agroconet team for help with products, orders or your account.",
        ],
      ]
    : [
        [
          "Informação clara dos produtos",
          "Consulte detalhes, vendedor, preço e disponibilidade antes de submeter um pedido.",
        ],
        [
          "Acompanhamento do pedido",
          "Veja a confirmação do vendedor e o progresso da entrega na sua conta.",
        ],
        [
          "Entrega local",
          "Coordene entregas em Maputo e Matola, conforme a cobertura activa e os detalhes do pedido.",
        ],
        [
          "Apoio quando precisar",
          "Fale com a equipa Agroconet sobre produtos, pedidos ou a sua conta.",
        ],
      ];
  return (
    <main className="farm-public-page farm-about-page">
      <ImageHero
        locale={locale}
        eyebrow={english ? "ABOUT AGROCONET" : "SOBRE A AGROCONET"}
        title={
          english ? (
            <>Agricultural supplies, closer to home</>
          ) : (
            <>Insumos agropecuários mais perto de si</>
          )
        }
        description={siteConfig.description}
      />
      <section className="farm-public-section farm-about-intro">
        <div>
          <p className="farm-eyebrow">
            {english ? "WHO WE SERVE" : "A QUEM SERVIMOS"}
          </p>
          <h2>
            {english
              ? "Built around local agricultural trade"
              : "Pensada para o comércio agrícola local"}
          </h2>
        </div>
        <p>
          {english
            ? "Agroconet connects agricultural suppliers, customers and delivery drivers through one catalogue and a shared order workflow."
            : "A Agroconet aproxima fornecedores agropecuários, clientes e entregadores através de um catálogo e de um fluxo de pedidos partilhado."}
        </p>
      </section>
      <section
        className="farm-public-section farm-about-roles"
        aria-label={
          english
            ? "Agroconet marketplace roles"
            : "Perfis do marketplace Agroconet"
        }
      >
        {roles.map(([title, description], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
      <section className="farm-public-section farm-about-why">
        <div className="farm-section-heading-copy">
          <div>
            <p className="farm-eyebrow">
              {english ? "WHY AGROCONET" : "PORQUÊ A AGROCONET"}
            </p>
            <h2>
              {english
                ? "Agricultural commerce needs clear information"
                : "O comércio agropecuário precisa de informação clara"}
            </h2>
          </div>
          <p>
            {english
              ? "Product details, seller confirmation and delivery coordination help everyone understand the next step in an order."
              : "Os detalhes do produto, a confirmação do vendedor e a coordenação da entrega ajudam todos a perceber qual é o próximo passo do pedido."}
          </p>
        </div>
        <div className="farm-about-values">
          {principles.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="farm-about-direction">
        <div className="farm-public-section farm-about-cta">
          <div>
            <p className="farm-eyebrow">
              {english ? "OUR DIRECTION" : "A NOSSA DIRECÇÃO"}
            </p>
            <h2>
              {english
                ? "A practical marketplace for local agriculture"
                : "Um marketplace prático para a agricultura local"}
            </h2>
            <p>
              {english
                ? "We are building Agroconet around a useful catalogue, clear order steps and delivery coordination for Maputo and Matola."
                : "Estamos a construir a Agroconet em torno de um catálogo útil, etapas claras para cada pedido e coordenação de entregas em Maputo e Matola."}
            </p>
          </div>
          <Link
            className="farm-button farm-button-primary"
            href="/como-funciona"
          >
            {english ? "See how it works" : "Veja como funciona"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

export function ContactPage({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  return (
    <main className="farm-public-page farm-contact-page">
      <section className="farm-contact-hero">
        <p className="farm-eyebrow">
          {english ? "AGROCONET SUPPORT" : "APOIO AGROCONET"}
        </p>
        <h1>{english ? "How can we help?" : "Como podemos ajudar?"}</h1>
        <p>
          {english
            ? "For account, order, delivery, product or seller questions, contact the Agroconet team or open a support conversation."
            : "Para dúvidas sobre conta, pedidos, entregas, produtos ou vendedores, contacte a equipa Agroconet ou abra uma conversa de apoio."}
        </p>
      </section>
      <section className="farm-contact-grid">
        <article className="farm-contact-card farm-contact-primary">
          <p className="farm-eyebrow">
            {english ? "CONTACT AGROCONET" : "CONTACTAR A AGROCONET"}
          </p>
          <h2>
            {english
              ? "Tell us what you need help with"
              : "Conte-nos em que podemos ajudar"}
          </h2>
          <p className="farm-contact-description">
            {english
              ? "Open a support conversation for help with an account, order or delivery. You can also use the public contacts below."
              : "Abra uma conversa de apoio para tratar de uma conta, pedido ou entrega. Também pode usar os contactos públicos abaixo."}
          </p>
          <div className="farm-contact-safety">
            <ShieldCheck aria-hidden="true" />
            <div>
              <strong>
                {english ? "Account safety" : "Segurança da conta"}
              </strong>
              <p>
                {english
                  ? "Support will never ask for your password, bank PIN, card PIN or one-time verification code."
                  : "O apoio nunca lhe pedirá a palavra-passe, PIN bancário, PIN do cartão ou código de verificação de uso único."}
              </p>
            </div>
          </div>
          <Suspense
            fallback={
              <p className="farm-contact-loading">
                {english ? "Loading contact details…" : "A carregar contactos…"}
              </p>
            }
          >
            <ContactDetails />
          </Suspense>
          <Link className="farm-button farm-button-primary" href="/apoio">
            {english ? "Send a support message" : "Enviar mensagem ao apoio"}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </article>
        <article className="farm-contact-card">
          <p className="farm-eyebrow">
            {english ? "QUICK HELP" : "AJUDA RÁPIDA"}
          </p>
          <h2>{english ? "Find the right page" : "Encontre a página certa"}</h2>
          <p className="farm-contact-description">
            {english
              ? "Choose a page for the most common questions."
              : "Escolha uma página para as questões mais frequentes."}
          </p>
          <ul>
            <li>
              <Link href="/recuperar">
                {english
                  ? "Recover account access"
                  : "Recuperar acesso à conta"}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
            <li>
              <Link href="/cliente/pedidos">
                {english ? "View your orders" : "Consultar os seus pedidos"}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
            <li>
              <Link href="/produtos">
                {english ? "Browse the catalogue" : "Explorar o catálogo"}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
