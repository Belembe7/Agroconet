import { Suspense } from "react";
import { connection } from "next/server";
import { AdminCatalogManager } from "@/features/admin/admin-catalog-manager";
import { prisma } from "@/lib/db";
import { requireAreaSession } from "@/lib/session";
import { AdminService } from "@/services/admin/admin-service";

export default function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="p-6">A carregar produtos…</p>}>
      <AdminProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminProductsContent({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const requestedSection = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  const initialSection =
    requestedSection === "pendentes"
      ? "pending"
      : requestedSection === "categorias"
        ? "categories"
        : "products";
  const session = await requireAreaSession("admin");
  const catalog = await new AdminService(prisma).catalogManagement(
    session.actor,
  );

  return <AdminCatalogManager {...catalog} initialSection={initialSection} />;
}
