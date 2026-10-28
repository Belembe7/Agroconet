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
    <>
      <h1 className="mb-6 text-2xl font-semibold">Atendimento aos clientes</h1>
      <SupportChat admin userId={session.user.id} />
    </>
  );
}
