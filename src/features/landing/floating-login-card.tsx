"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";
import type { SiteLocale } from "@/lib/locale";

export function FloatingLoginCard({ locale }: { locale: SiteLocale }) {
  const [isFilled, setIsFilled] = useState(false);
  const english = locale === "en";

  return (
    <aside
      className={
        isFilled
          ? "hero-login-card"
          : "hero-login-card hero-login-card-floating"
      }
      aria-labelledby="hero-login-title"
    >
      <div className="hero-login-heading">
        <span className="hero-login-mark" aria-hidden="true">
          <Leaf className="size-4" />
        </span>
        <div>
          <p>{english ? "AGROCONET ACCOUNT" : "CONTA AGROCONET"}</p>
          <h2 id="hero-login-title">
            {english ? "Welcome back" : "Aceda à sua conta"}
          </h2>
        </div>
      </div>
      <LoginForm compact locale={locale} onFilledChange={setIsFilled} />
      <p className="hero-login-register">
        {english ? "New to Agroconet?" : "Ainda não faz parte da Agroconet?"}{" "}
        <Link href="/registar">
          {english ? "Create an account" : "Criar conta"}
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </p>
    </aside>
  );
}
