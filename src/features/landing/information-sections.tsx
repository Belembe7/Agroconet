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
import { GoogleDeliveryMap } from "@/features/landing/google-delivery-map";
import { env } from "@/lib/env";

const steps = [
  {
    icon: Search,
    title: "Encontre o que precisa",
    description:
      "Explore as categorias e pesquise por produto ou marca nos destaques.",
  },
  {
    icon: MessageCircle,
    title: "Esclareça as suas dúvidas",
    description:
      "Contacte a Agroconet para confirmar a opção, a disponibilidade e as condições de compra.",
  },
  {
    icon: Truck,
    title: "Combine a sua entrega",
    description:
      "Confirme a morada e a cobertura da zona com a nossa equipa antes de finalizar.",
  },
];
export function HowItWorks() {
  return (
    <section id="como-funciona" className="guide-section">
      <div className="section-topline">
        <div>
          <p className="guide-eyebrow">DO PRIMEIRO PASSO À PRÓXIMA CONQUISTA</p>
          <h2>
            Menos distância.
            <br />
            <span className="editorial-accent">Mais possibilidades.</span>
          </h2>
        </div>
        <p className="section-side-note">
          Aproximamos o que precisa do lugar onde faz crescer.
        </p>
      </div>
      <ol className="landing-steps">
        {steps.map(({ icon: Icon, ...step }, index) => (
          <li key={step.title}>
            <span className="step-number">0{index + 1}</span>
            <Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function SellerInvitation() {
  return (
    <section id="vendedores" className="seller-invitation">
      <SellerFieldVideo />
      <div className="seller-invitation-inner">
        <div className="seller-emblem" aria-hidden="true">
          <Store strokeWidth={1} />
          <span>FAÇA CRESCER O SEU NEGÓCIO</span>
        </div>
        <div>
          <p className="guide-eyebrow">PARA QUEM TEM MAIS PARA OFERECER</p>
          <h2>
            O próximo cliente
            <br />
            pode estar <em>mais perto.</em>
          </h2>
          <p>
            Tem uma loja ou fornece insumos agropecuários? Fale connosco sobre
            como fazer parte da Agroconet. A entrada de vendedores está sujeita
            a análise e aprovação.
          </p>
          <Link className="creative-button seller-cta" href="/#contactos">
            Quero ser vendedor{" "}
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
    return (
      <GoogleDeliveryMap
        zones={[]}
        apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY}
      />
    );
  }
  return (
    <GoogleDeliveryMap
      zones={zones}
      apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY}
    />
  );
}
export function ConfidenceSection() {
  return (
    <section className="confidence-section" aria-label="Compromissos Agroconet">
      <div>
        <ShieldCheck aria-hidden="true" />
        <h3>Vendedores aprovados</h3>
        <p>
          Apenas produtos publicados por vendedores aprovados aparecem na nossa
          montra.
        </p>
      </div>
      <div>
        <Wallet aria-hidden="true" />
        <h3>Preços claros</h3>
        <p>
          Consulte o valor de cada opção. Confirme o total e a entrega antes de
          comprar.
        </p>
      </div>
      <div>
        <Leaf aria-hidden="true" />
        <h3>Apoio próximo</h3>
        <p>
          Uma equipa para esclarecer dúvidas e ajudar a encontrar o que faz
          sentido para si.
        </p>
      </div>
    </section>
  );
}
