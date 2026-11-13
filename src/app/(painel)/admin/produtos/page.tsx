import { Suspense } from "react";
import { connection } from "next/server";
import { AdminCatalogManager } from "@/features/admin/admin-catalog-manager";
import { prisma } from "@/lib/db";
import { requireAreaSession } from "@/lib/session";
import { AdminService } from "@/services/admin/admin-service";

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p className="p-6">A carregar produtos…</p>}>
      <AdminProductsContent />
    </Suspense>
  );
}

async function AdminProductsContent() {
  await connection();
  const session = await requireAreaSession("admin");
  const catalog = await new AdminService(prisma).catalogManagement(
    session.actor,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted-foreground text-sm">Catálogo público</p>
        <h1 className="text-2xl font-semibold">Gerenciar Produtos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Produtos, categorias, imagens, preços, stock e promoções da loja.
        </p>
      </header>
      <AdminCatalogManager {...catalog} />
    </div>
  );
}
