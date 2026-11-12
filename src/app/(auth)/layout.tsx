import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
      </div>
    </div>
  );
}
