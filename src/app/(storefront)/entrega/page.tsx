import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { defaultAreaPathForRoles } from "@/lib/area-access";
import { DeliveryPlanner } from "@/features/delivery/delivery-planner";

export default function DeliveryPage() {
  return (
    <Suspense fallback={<p className="p-8">A carregar o mapa de entrega…</p>}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await connection();
  const session = await getAppSession();
  if (!session) redirect("/entrar?next=%2Fentrega");

  const isAdmin = session.actor.roles.some(
    (role) => role === "ADMIN" || role === "SUPER_ADMIN",
  );
  const returnPath = defaultAreaPathForRoles(session.actor.roles);

  return (
    <main className="customer-service-page">
      <Link
        href={returnPath}
        className="hover:bg-muted focus-visible:ring-ring mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {isAdmin ? "Voltar ao painel" : "Voltar à minha área"}
      </Link>
      <DeliveryPlanner />
    </main>
  );
}
