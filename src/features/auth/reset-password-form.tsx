"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/features/auth/field";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
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
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);

    if (resetError) {
      setError(
        resetError.message ??
          "O link expirou. Peça um novo link de recuperação.",
      );
      return;
    }
    router.push("/entrar");
    router.refresh();
  }

  if (!token) {
    return (
      <div className="space-y-3 text-center text-sm">
        <p>Este link de recuperação é inválido ou expirou.</p>
        <Link
          href="/recuperar"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <AuthField
        label="Nova palavra-passe"
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
        {pending ? "A guardar…" : "Redefinir palavra-passe"}
      </Button>
    </form>
  );
}
