import { Suspense } from "react";
import { requireAreaSession } from "@/lib/session";
import { SupportChat } from "@/features/support/support-chat";
export default function AdminSupportPage() {
  return (
    <Suspense fallback={<p>A carregar atendimento…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  const session = await requireAreaSession("admin");
  return (
    <div className="space-y-5">
      <header className="bg-card rounded-2xl border p-5 sm:p-6">
        <p className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
          Operações · Atendimento
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Atendimento aos clientes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Consulte conversas, responda aos clientes e acompanhe o estado de cada
          pedido de apoio.
        </p>
      </header>
      <SupportChat admin userId={session.user.id} />
    </div>
  );
}
