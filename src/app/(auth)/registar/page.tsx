import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function RegistarPage() {
  return (
    <div className="border-border bg-card/80 rounded-2xl border p-6 shadow-sm backdrop-blur">
      <h1 className="text-foreground text-xl font-semibold">Criar conta</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Crie a sua conta com nome, email e palavra-passe. Usaremos o email para
        notificações e atualizações da sua conta.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
