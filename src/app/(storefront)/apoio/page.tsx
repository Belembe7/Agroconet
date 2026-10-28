import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { getSiteLocale } from "@/lib/locale";
import { SupportChat } from "@/features/support/support-chat";
import { isSupportAdmin } from "@/services/support/support-service";
export default function SupportPage() {
  return (
    <Suspense fallback={<p className="p-8">A carregar atendimento…</p>}>
      <Content />
    </Suspense>
  );
}
async function Content() {
  await connection();
  const session = await getAppSession();
  if (!session) redirect("/entrar?next=%2Fapoio");
  const locale = await getSiteLocale();
  return (
    <main className="customer-service-page">
      <SupportChat
        userId={session.user.id}
        admin={isSupportAdmin(session.actor)}
        locale={locale}
      />
    </main>
  );
}
