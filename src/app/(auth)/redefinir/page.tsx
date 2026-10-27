import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir palavra-passe",
};

export default function RedefinirPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return (
    <div className="border-border bg-card/80 rounded-2xl border p-6 shadow-sm backdrop-blur">
      <h1 className="text-foreground text-xl font-semibold">
        Redefinir palavra-passe
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Escolha uma nova palavra-passe para a sua conta.
      </p>
      <div className="mt-6">
        <Suspense
          fallback={<p className="text-foreground/60 text-sm">A carregar…</p>}
        >
          <ResetPasswordFormWithToken searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function ResetPasswordFormWithToken({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const resetToken = Array.isArray(token) ? (token[0] ?? "") : (token ?? "");

  return <ResetPasswordForm token={resetToken} />;
}
