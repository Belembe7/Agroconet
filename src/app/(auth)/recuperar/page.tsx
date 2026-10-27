import type { Metadata } from "next";
import { RecoverForm } from "@/features/auth/recover-form";

export const metadata: Metadata = {
  title: "Recuperar palavra-passe",
};

export default function RecuperarPage() {
  return (
    <div className="border-border bg-card/80 rounded-2xl border p-6 shadow-sm backdrop-blur">
      <h1 className="text-foreground text-xl font-semibold">
        Recuperar palavra-passe
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Enviaremos um link de recuperação para o email associado à sua conta.
      </p>
      <div className="mt-6">
        <RecoverForm />
      </div>
    </div>
  );
}
