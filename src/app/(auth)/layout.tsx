import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";
import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-experience">
      <div className="auth-form-side">
        <header>
          <Brand />
          <Link href="/" className="auth-back">
            Voltar à loja <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </header>
        <main>{children}</main>
        <footer>
          <Leaf aria-hidden="true" className="size-4" /> Raízes locais. Ambição
          maior.
        </footer>
      </div>
      <aside className="auth-story" aria-label="A nossa inspiração">
        <Image
          src="/images/agro-editorial.png"
          alt="Campo agrícola iluminado pelo sol. Imagem ilustrativa."
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="auth-story-shade" />
        <div className="auth-story-copy">
          <span>JUNTOS, DO INÍCIO À COLHEITA</span>
          <h2>
            Boas ligações.
            <br />
            <em>Grandes colheitas.</em>
          </h2>
          <p>O próximo capítulo do seu campo começa aqui.</p>
        </div>
      </aside>
    </div>
  );
}
