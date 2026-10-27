"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/features/auth/field";
import { safeInternalPath } from "@/lib/area-access";
import { authClient } from "@/lib/auth-client";
import { mergeGuestCartAfterLogin } from "@/features/cart/actions";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message ?? "Não foi possível entrar.");
        toast.error("Não foi possível iniciar sessão.");
        return;
      }

      const cartResult = await mergeGuestCartAfterLogin();
      if (!cartResult.ok) toast.info(cartResult.error);
      toast.success("Login feito com sucesso.");
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError(
        "Não foi possível entrar. Verifique a ligação e tente novamente.",
      );
      toast.error("Não foi possível iniciar sessão.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={onSubmit}>
        <AuthField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
        />
        <AuthField
          label="Palavra-passe"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete="current-password"
          minLength={8}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "A entrar…" : "Entrar"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        <Link
          href="/recuperar"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          Esqueci a palavra-passe
        </Link>
      </p>
      <p className="text-muted-foreground text-center text-sm">
        Ainda não tem conta?{" "}
        <Link
          href="/registar"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
