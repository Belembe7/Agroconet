import { Suspense, type ReactNode } from "react";
import { AreaLoading } from "@/components/layout/area-loading";
import { AreaShell } from "@/components/layout/area-shell";
import { requireAreaSession } from "@/lib/session";

async function ProtectedArea({ children }: { children: ReactNode }) {
  const session = await requireAreaSession("cliente");

  return (
    <AreaShell
      area="cliente"
      title="A minha conta"
      subtitle="Pedidos, endereços e favoritos"
      userName={session.user.name}
    >
      {children}
    </AreaShell>
  );
}

export default function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AreaLoading />}>
      <ProtectedArea>{children}</ProtectedArea>
    </Suspense>
  );
}
