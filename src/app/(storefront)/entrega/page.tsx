import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
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
  return (
    <main className="customer-service-page">
      <DeliveryPlanner />
    </main>
  );
}
