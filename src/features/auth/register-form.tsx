"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  registerSellerAccountAction,
  type SellerRegistrationInput,
} from "@/features/auth/actions";
import { AuthField } from "@/features/auth/field";
import { authClient } from "@/lib/auth-client";
import { mergeGuestCartAfterLogin } from "@/features/cart/actions";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"customer" | "seller">(
    "customer",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [addressText, setAddressText] = useState("");
  const [sellerApplicationRetry, setSellerApplicationRetry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sellerRegistration: SellerRegistrationInput = {
    businessName,
    phone,
    province,
    district,
    addressText,
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (accountType === "seller" && sellerApplicationRetry) {
      setPending(true);
      setError(null);
      try {
        await registerSellerAccountAction(sellerRegistration);
        toast.success("Candidatura enviada. Aguarde a aprovação da Agroconet.");
        router.replace("/vendedor");
        router.refresh();
      } catch {
        const message =
          "Não foi possível enviar a candidatura agora. Corrija os dados comerciais ou tente novamente.";
        setError(message);
        toast.error(message);
      } finally {
        setPending(false);
      }
      return;
    }

    if (password !== confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (
      accountType === "seller" &&
      (!businessName.trim() ||
        !phone.trim() ||
        !province.trim() ||
        !district.trim() ||
        !addressText.trim())
    ) {
      setError(
        "Preencha os dados do negócio para criar uma conta de vendedor.",
      );
      return;
    }
    if (
      accountType === "seller" &&
      (name.trim().startsWith("[DEV]") ||
        businessName.trim().startsWith("[DEV]") ||
        email.trim().toLowerCase().endsWith("@dev.agroconet.local") ||
        email.trim().toLowerCase().endsWith("@example.invalid"))
    ) {
      setError(
        "Use os dados reais da pessoa e do negócio para se candidatar como vendedor.",
      );
      return;
    }

    setPending(true);
    setError(null);
    let sellerAccountCreated = false;
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

      if (accountType === "seller") {
        sellerAccountCreated = true;
        setSellerApplicationRetry(true);
        await registerSellerAccountAction(sellerRegistration);
        toast.success("Candidatura enviada. Aguarde a aprovação da Agroconet.");
        router.replace("/vendedor");
        router.refresh();
        return;
      }

      const cartResult = await mergeGuestCartAfterLogin();
      if (!cartResult.ok) toast.info(cartResult.error);
      toast.success("Conta criada com sucesso.");
      router.replace("/cliente");
      router.refresh();
    } catch {
      const message = sellerAccountCreated
        ? "A conta foi criada, mas a candidatura não foi concluída. Pode tentar enviar novamente."
        : "Não foi possível criar a conta. Tente novamente.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {!sellerApplicationRetry ? (
        <>
          <fieldset className="space-y-2">
            <legend className="text-foreground text-sm font-medium">
              Tipo de conta
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${accountType === "customer" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="customer"
                  checked={accountType === "customer"}
                  onChange={() => setAccountType("customer")}
                  className="accent-primary mt-1"
                />
                <span>
                  <span className="block font-semibold">Cliente</span>
                  <span className="text-muted-foreground text-xs">
                    Comprar na Agroconet
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${accountType === "seller" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="seller"
                  checked={accountType === "seller"}
                  onChange={() => setAccountType("seller")}
                  className="accent-primary mt-1"
                />
                <span>
                  <span className="block font-semibold">Vendedor</span>
                  <span className="text-muted-foreground text-xs">
                    Gerir a sua loja
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
          <AuthField
            label="Nome da pessoa responsável"
            value={name}
            onChange={(value) => {
              setName(value);
              setError(null);
            }}
            autoComplete="name"
          />
          <AuthField
            label="Email para notificações"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setError(null);
            }}
            type="email"
            autoComplete="email"
          />
          <AuthField
            label="Palavra-passe"
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
        </>
      ) : (
        <p className="bg-muted rounded-xl p-3 text-sm">
          A conta de <strong>{email}</strong> já foi criada. Envie os dados do
          negócio para terminar a candidatura.
        </p>
      )}

      {accountType === "seller" ? (
        <fieldset className="space-y-3 rounded-xl border p-3 sm:p-4">
          <legend className="px-1 text-sm font-semibold">
            Dados do negócio
          </legend>
          <AuthField
            label="Nome comercial"
            value={businessName}
            onChange={(value) => {
              setBusinessName(value);
              setError(null);
            }}
            autoComplete="organization"
          />
          <AuthField
            label="Telefone de contacto"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              setError(null);
            }}
            type="tel"
            autoComplete="tel"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <AuthField
              label="Província"
              value={province}
              onChange={(value) => {
                setProvince(value);
                setError(null);
              }}
              autoComplete="address-level1"
            />
            <AuthField
              label="Distrito ou município"
              value={district}
              onChange={(value) => {
                setDistrict(value);
                setError(null);
              }}
              autoComplete="address-level2"
            />
          </div>
          <AuthField
            label="Endereço da loja ou ponto de recolha"
            value={addressText}
            onChange={(value) => {
              setAddressText(value);
              setError(null);
            }}
            autoComplete="street-address"
          />
          <p className="text-muted-foreground text-xs">
            A conta de vendedor fica pendente até a Agroconet aprovar o negócio.
          </p>
        </fieldset>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? accountType === "seller"
            ? "A enviar candidatura…"
            : "A criar conta…"
          : sellerApplicationRetry
            ? "Tentar enviar candidatura novamente"
            : accountType === "seller"
              ? "Criar conta de vendedor"
              : "Criar conta de cliente"}
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
