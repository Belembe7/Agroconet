"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      toast.success("Sessão encerrada com sucesso.");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Não foi possível terminar a sessão.");
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      disabled={pending}
      onClick={onLogout}
    >
      {pending ? "A sair…" : "Sair"}
    </Button>
  );
}
