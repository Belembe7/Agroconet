import Link from "next/link";
import { connection } from "next/server";
import {
  Search,
  MessageCircle,
  Truck,
  ArrowUpRight,
  Store,
  ShieldCheck,
  Wallet,
  Leaf,
} from "lucide-react";
import { getDeliveryZones } from "@/features/landing/data";
import { SellerFieldVideo } from "@/features/landing/seller-field-video";
import { DeliveryCoverageMap } from "@/features/landing/coverage-map";
import type { SiteLocale } from "@/lib/locale";

export function HowItWorks({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  const steps = english
    ? [
        {
          icon: Search,
          title: "Find what you need",
          href: "/produtos",
          action: "Explore products",
          description:
            "Browse categories and search products or brands in our catalogue.",
        },
        {
          icon: MessageCircle,
          title: "Get your questions answered",
          href: "/apoio",
          action: "Open support chat",
          description:
            "Contact Agroconet to confirm options, availability and purchase terms.",
        },
        {
          icon: Truck,
          title: "Arrange delivery",
          href: "/entrega",
          action: "Plan delivery on the map",
          description:
            "Confirm your address and area coverage with our team before checkout.",
        },
      ]
    : [
        {
          icon: Search,
          title: "Encontre o que precisa",
          href: "/produtos",
          action: "Explorar produtos",
          description:
            "Explore as categorias e pesquise por produto ou marca no catálogo.",
        },
        {
          icon: MessageCircle,
          title: "Esclareça as suas dúvidas",
          href: "/apoio",
          action: "Abrir chat de apoio",
          description:
            "Contacte a Agroconet para confirmar a opção, a disponibilidade e as condições de compra.",
        },
        {
          icon: Truck,
          title: "Combine a sua entrega",
          href: "/entrega",
          action: "Marcar destino no mapa",
          description:
            "Confirme a morada e a cobertura da zona com a nossa equipa antes de finalizar.",
        },
      ];
  return (
    <section id="como-funciona" className="guide-section">
      <div className="section-topline">
        <div>
          <p className="guide-eyebrow">
            {english
              ? "FROM THE FIRST STEP TO WHAT'S NEXT"
              : "DO PRIMEIRO PASSO À PRÓXIMA CONQUISTA"}
          </p>
          <h2>
            {english ? "Less distance." : "Menos distância."}
            <br />
            <span className="editorial-accent">
              {english ? "More possibilities." : "Mais possibilidades."}
            </span>
          </h2>
        </div>
        <p className="section-side-note">
          {english
            ? "We bring what you need closer to where you grow."
            : "Aproximamos o que precisa do lugar onde faz crescer."}
        </p>
      </div>
      <ol className="landing-steps">
        {steps.map(({ icon: Icon, ...step }, index) => (
          <li key={step.title}>
            <Link
              href={step.href}
              className="landing-step-action"
              aria-labelledby={`step-title-${index} step-action-${index}`}
            >
              <Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
              <h3 id={`step-title-${index}`}>{step.title}</h3>
              <p>{step.description}</p>
              <span className="landing-step-cta" id={`step-action-${index}`}>
                {step.action}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function SellerInvitation({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  return (
    <section id="vendedores" className="seller-invitation">
      <SellerFieldVideo />
      <div className="seller-invitation-inner">
        <div className="seller-emblem" aria-hidden="true">
          <Store strokeWidth={1} />
          <span>
            {english ? "GROW YOUR BUSINESS" : "FAÇA CRESCER O SEU NEGÓCIO"}
          </span>
        </div>
        <div>
          <p className="guide-eyebrow">
            {english
              ? "FOR THOSE WITH MORE TO OFFER"
              : "PARA QUEM TEM MAIS PARA OFERECER"}
          </p>
          <h2>
            {english ? "Your next customer" : "O próximo cliente"}
            <br />
            {english ? (
              <>
                could be <em>closer.</em>
              </>
            ) : (
              <>
                pode estar <em>mais perto.</em>
              </>
            )}
          </h2>
          <p>
            {english
              ? "Do you own a shop or supply agricultural inputs? Talk to us about joining Agroconet. Seller applications are subject to review and approval."
              : "Tem uma loja ou fornece insumos agropecuários? Fale connosco sobre como fazer parte da Agroconet. A entrada de vendedores está sujeita a análise e aprovação."}
          </p>
          <Link className="creative-button seller-cta" href="/#contactos">
            {english ? "Become a seller" : "Quero ser vendedor"}{" "}
            <ArrowUpRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
export async function DeliveryCoverage() {
  await connection();
  let zones;
  try {
    zones = await getDeliveryZones();
  } catch {
    return <DeliveryCoverageMap zones={[]} />;
  }
  return <DeliveryCoverageMap zones={zones} />;
}
export function ConfidenceSection({ locale }: { locale: SiteLocale }) {
  const english = locale === "en";
  return (
    <section
      className="confidence-section"
      aria-label={english ? "Agroconet commitments" : "Compromissos Agroconet"}
    >
      <div>
        <ShieldCheck aria-hidden="true" />
        <h3>{english ? "Approved sellers" : "Vendedores aprovados"}</h3>
        <p>
          {english
            ? "Only products from approved sellers appear in our marketplace."
            : "Apenas produtos publicados por vendedores aprovados aparecem na nossa montra."}
        </p>
      </div>
      <div>
        <Wallet aria-hidden="true" />
        <h3>{english ? "Clear pricing" : "Preços claros"}</h3>
        <p>
          {english
            ? "Review each option's price. Confirm the total and delivery before buying."
            : "Consulte o valor de cada opção. Confirme o total e a entrega antes de comprar."}
        </p>
      </div>
      <div>
        <Leaf aria-hidden="true" />
        <h3>{english ? "Helpful support" : "Apoio próximo"}</h3>
        <p>
          {english
            ? "Our team can answer questions and help you find what works for you."
            : "Uma equipa para esclarecer dúvidas e ajudar a encontrar o que faz sentido para si."}
        </p>
      </div>
    </section>
  );
}
