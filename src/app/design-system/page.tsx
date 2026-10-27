import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Sprout,
  Truck,
  ShieldCheck,
  Wheat,
  Sun,
  MoveUpRight,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { DesignSystemDemo } from "@/components/shared/design-system-demo";

export const metadata: Metadata = {
  title: "Uma nova Agroconet",
  robots: { index: false, follow: false },
};
const categories = [
  {
    icon: Sprout,
    name: "Comece pela semente.",
    detail: "Sementes & mudas",
    style: "category-seed",
    number: "01",
  },
  {
    icon: Wheat,
    name: "Nutra cada conquista.",
    detail: "Nutrição & cultivo",
    style: "category-grow",
    number: "02",
  },
  {
    icon: Sun,
    name: "Cuide do que cresce.",
    detail: "Cuidado & protecção",
    style: "category-care",
    number: "03",
  },
];
export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <div className="creative-guide">
      <div className="guide-ribbon">
        <span className="inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-current" /> UMA NOVA ENERGIA
          PARA O CAMPO
        </span>
        <span className="hidden sm:inline">Direcção visual · 02</span>
      </div>
      <header className="guide-navigation">
        <Brand />
        <nav
          aria-label="Navegação do guia"
          className="flex items-center gap-5 sm:gap-8"
        >
          <a
            href="#experiencia"
            className="hidden text-sm font-medium md:inline-flex"
          >
            A experiência
          </a>
          <a
            href="#identidade"
            className="hidden text-sm font-medium sm:inline-flex"
          >
            A identidade
          </a>
          <a href="#componentes" className="guide-nav-cta">
            Explorar o design{" "}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main>
        <section className="guide-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="guide-eyebrow">
              <span className="eyebrow-line" /> DA TERRA. COM FUTURO.
            </p>
            <h1 id="hero-title">
              O seu campo.
              <br />O seu potencial.
              <br />
              <span className="hero-highlight">
                Sem limites.
                <svg
                  viewBox="0 0 460 20"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M4 14 Q210 -4 453 10" />
                </svg>
              </span>
            </h1>
            <p className="hero-description">
              Há muito por crescer. Ligamos quem produz às soluções certas, para
              transformar o trabalho de hoje nas conquistas de amanhã.
            </p>
            <div className="hero-actions">
              <a href="#experiencia" className="creative-button">
                Conheça a nova Agroconet{" "}
                <ArrowUpRight aria-hidden="true" className="size-5" />
              </a>
              <a href="#componentes" className="hero-secondary">
                Ver componentes{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>
            <div className="hero-location">
              <span className="location-icon">
                <Leaf aria-hidden="true" className="size-4" />
              </span>
              <div>
                <strong>Raízes locais. Ambição maior.</strong>
                <span>Maputo & Matola, Moçambique</span>
              </div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-photo">
              <Image
                src="/images/agro-editorial.png"
                alt="Agricultora num campo verde, com uma caixa de hortícolas sob a luz da manhã. Imagem ilustrativa gerada para a proposta visual."
                fill
                sizes="(max-width: 800px) 100vw, 50vw"
                priority
                className="object-cover"
              />
              <div className="photo-shade" />
              <span className="photo-caption">
                CULTIVAR É ACREDITAR NO AMANHÃ.
              </span>
            </div>
            <div className="harvest-seal">
              <Sun aria-hidden="true" className="size-7" />
              <span>
                Feito para
                <br />
                <strong>crescer.</strong>
              </span>
            </div>
            <div className="hero-note">
              <span className="note-icon">
                <Sprout aria-hidden="true" className="size-6" />
              </span>
              <div>
                <span>JUNTOS, DO INÍCIO À COLHEITA</span>
                <strong>Mais vida em cada escolha.</strong>
              </div>
              <ArrowUpRight aria-hidden="true" className="ml-auto size-5" />
            </div>
            <div className="art-dots" aria-hidden="true" />
          </div>
        </section>
        <div className="guide-promise-strip">
          <span>
            <Sprout aria-hidden="true" />
            Boas escolhas. Novos começos.
          </span>
          <span>
            <Truck aria-hidden="true" />
            Mais perto de quem produz.
          </span>
          <span>
            <ShieldCheck aria-hidden="true" />
            Confiança em cada etapa.
          </span>
          <span className="promise-signature">
            É assim que crescemos. <MoveUpRight aria-hidden="true" />
          </span>
        </div>
        <section id="experiencia" className="guide-section">
          <div className="section-topline">
            <div>
              <p className="guide-eyebrow">01 / A EXPERIÊNCIA</p>
              <h2>
                Um mundo de possibilidades.
                <br />
                <span className="editorial-accent">Uma ligação à terra.</span>
              </h2>
            </div>
            <p className="section-side-note">
              Uma amostra da linguagem visual para as futuras categorias da
              loja.
            </p>
          </div>
          <div className="category-grid">
            {categories.map(({ icon: Icon, ...item }) => (
              <article
                key={item.number}
                className={`creative-category ${item.style}`}
              >
                <div className="category-top">
                  <span>{item.detail}</span>
                  <span>{item.number}</span>
                </div>
                <Icon
                  aria-hidden="true"
                  className="category-illustration"
                  strokeWidth={1}
                />
                <div className="category-bottom">
                  <h3>{item.name}</h3>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-6 shrink-0"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="identidade" className="identity-section">
          <div className="identity-inner">
            <div>
              <p className="guide-eyebrow">02 / A IDENTIDADE</p>
              <h2>
                Natural na essência.
                <br />
                <span>Viva na expressão.</span>
              </h2>
              <p>
                Verdes com profundidade. Lima com energia. Tons quentes que nos
                aproximam da terra. Uma marca que se reconhece e se sente.
              </p>
              <a href="#componentes" className="identity-link">
                Descubra os detalhes{" "}
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
            <div className="identity-board">
              <div className="type-sample">
                <span>Aa</span>
                <div>
                  <strong>DM Sans + Lora</strong>
                  <p>
                    Clareza para agir.
                    <br />
                    Expressão para inspirar.
                  </p>
                </div>
              </div>
              <div className="palette-composition">
                <div className="palette-forest">
                  <span>Floresta</span>
                  <span>#123B2A</span>
                </div>
                <div className="palette-lime">
                  <span>Lima</span>
                  <span>#D5EF80</span>
                </div>
                <div className="palette-clay">
                  <span>Terra</span>
                  <span>#F0C5AE</span>
                </div>
                <div className="palette-cream">
                  <span>Linho</span>
                  <span>#FBFAF6</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="componentes" className="guide-section components-section">
          <div className="section-topline">
            <div>
              <p className="guide-eyebrow">
                03 / OS DETALHES FAZEM A DIFERENÇA
              </p>
              <h2>
                Bonito de ver.
                <br />
                <span className="editorial-accent">Simples de usar.</span>
              </h2>
            </div>
            <p className="section-side-note">
              Experimente os componentes. Todos os dados abaixo são exemplos,
              sem gravação.
            </p>
          </div>
          <DesignSystemDemo />
        </section>
      </main>
      <footer className="creative-footer">
        <Brand />
        <p>Cultivamos ligações. Fazemos crescer possibilidades.</p>
        <span>Proposta visual · Fase 4</span>
      </footer>
    </div>
  );
}
