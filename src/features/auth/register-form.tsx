"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/features/auth/field";
import { authClient } from "@/lib/auth-client";
import { mergeGuestCartAfterLogin } from "@/features/cart/actions";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.error) {
        setError(result.error.message ?? "Não foi possível criar a conta.");
        toast.error("Não foi possível criar a conta.");
        return;
      }

      const cartResult = await mergeGuestCartAfterLogin();
      if (!cartResult.ok) toast.info(cartResult.error);
      toast.success("Conta criada com sucesso.");
      router.replace("/cliente");
      router.refresh();
    } catch {
      setError("Não foi possível criar a conta. Tente novamente.");
      toast.error("Não foi possível criar a conta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <AuthField
        label="Nome"
        value={name}
        onChange={setName}
        autoComplete="name"
      />
      <AuthField
        label="Email para notificações"
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
        autoComplete="new-password"
        minLength={8}
      />
      <AuthField
        label="Confirmar palavra-passe"
        value={confirm}
        onChange={setConfirm}
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A criar conta…" : "Criar conta"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
