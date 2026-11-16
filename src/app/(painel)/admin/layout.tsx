import { Suspense, type ReactNode } from "react";
import { AreaLoading } from "@/components/layout/area-loading";
import { AreaShell } from "@/components/layout/area-shell";
import { requireAreaSession } from "@/lib/session";

async function ProtectedArea({ children }: { children: ReactNode }) {
  const session = await requireAreaSession("admin");

  return (
    <AreaShell
      area="admin"
      title="Administração"
      subtitle="Área reservada a administradores"
      userName={session.user.name}
    >
      {children}
    </AreaShell>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AreaLoading />}>
      <ProtectedArea>{children}</ProtectedArea>
    </Suspense>
  );
}
