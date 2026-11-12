"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/features/auth/field";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

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
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(
          resetError.message ??
            "O link expirou. Peça um novo link de recuperação.",
        );
        return;
      }
      toast.success("Palavra-passe alterada. Já pode iniciar sessão.");
      router.replace("/entrar");
      router.refresh();
    } catch {
      setError(
        "Não foi possível alterar a palavra-passe. Verifique a ligação e tente novamente.",
      );
    } finally {
      setPending(false);
    }
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
        onChange={(value) => {
          setPassword(value);
          setError(null);
        }}
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      <AuthField
        label="Confirmar palavra-passe"
        value={confirm}
        onChange={(value) => {
          setConfirm(value);
          setError(null);
        }}
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A guardar…" : "Redefinir palavra-passe"}
      </Button>
    </form>
  );
}
