"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/features/auth/field";
import { authClient } from "@/lib/auth-client";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const { error: requestError } = await authClient.requestPasswordReset({
      email: email.trim().toLowerCase(),
      redirectTo: "/redefinir",
    });

    setPending(false);
    if (requestError) {
      setError(requestError.message ?? "Não foi possível pedir a recuperação.");
      return;
    }
    setMessage(
      "Se existir uma conta associada a este email, receberá um link para redefinir a palavra-passe.",
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <AuthField
        label="Email da conta"
        value={email}
        onChange={setEmail}
        type="email"
        autoComplete="email"
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A enviar…" : "Enviar link de recuperação"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        <Link
          href="/entrar"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
