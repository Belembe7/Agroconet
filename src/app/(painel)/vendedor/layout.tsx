import { Suspense, type ReactNode } from "react";
import { AreaLoading } from "@/components/layout/area-loading";
import { AreaShell } from "@/components/layout/area-shell";
import { requireAreaSession } from "@/lib/session";

async function ProtectedArea({ children }: { children: ReactNode }) {
  const session = await requireAreaSession("vendedor");

  return (
    <AreaShell
      area="vendedor"
      title="Área do vendedor"
      subtitle="Catálogo, stock e encomendas"
      userName={session.user.name}
    >
      {children}
    </AreaShell>
  );
}

export default function VendedorLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AreaLoading />}>
      <ProtectedArea>{children}</ProtectedArea>
    </Suspense>
  );
}
