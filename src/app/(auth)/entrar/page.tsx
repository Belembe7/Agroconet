import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function EntrarPage() {
  return (
    <div className="border-border bg-card/80 rounded-2xl border p-6 shadow-sm backdrop-blur">
      <h1 className="text-foreground text-xl font-semibold">Entrar</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Entre com o email e a palavra-passe da sua conta.
      </p>
      <div className="mt-6">
        <Suspense
          fallback={<p className="text-foreground/60 text-sm">A carregar…</p>}
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
