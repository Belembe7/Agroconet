"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { getPostLoginPathAction } from "@/features/auth/actions";
import { AuthField } from "@/features/auth/field";
import { safeInternalPath } from "@/lib/area-access";
import { authClient } from "@/lib/auth-client";
import { mergeGuestCartAfterLogin } from "@/features/cart/actions";
import { toast } from "sonner";

export function LoginForm({
  compact = false,
  locale = "pt",
  onFilledChange,
}: {
  compact?: boolean;
  locale?: "pt" | "en";
  onFilledChange?: (filled: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const nextPath = requestedNext ? safeInternalPath(requestedNext, "") : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    onFilledChange?.(Boolean(email.trim() && password));
  }, [email, onFilledChange, password]);

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
      const destination = nextPath || (await getPostLoginPathAction());
      router.replace(destination);
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
    <div className={compact ? "hero-login-form" : "space-y-4"}>
      <form className="space-y-3" onSubmit={onSubmit}>
        <AuthField
          label={locale === "en" ? "Email address" : "Email"}
          value={email}
          onChange={(value) => {
            setEmail(value);
            setError(null);
          }}
          type="email"
          autoComplete="email"
        />
        <AuthField
          label={locale === "en" ? "Password" : "Palavra-passe"}
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError(null);
          }}
          type="password"
          autoComplete="current-password"
          minLength={8}
        />
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? locale === "en"
              ? "Signing in…"
              : "A entrar…"
            : locale === "en"
              ? "Sign in"
              : "Entrar"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        <Link
          href="/recuperar"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          {locale === "en" ? "Forgot password?" : "Esqueci a palavra-passe"}
        </Link>
      </p>
      {!compact ? (
        <p className="text-muted-foreground text-center text-sm">
          {locale === "en" ? "New here?" : "Ainda não tem conta?"}{" "}
          <Link
            href="/registar"
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            {locale === "en" ? "Create account" : "Criar conta"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
