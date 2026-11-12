import { Suspense } from "react";
import { connection } from "next/server";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AddressForm } from "@/features/customer/address-form";
import { displayName } from "@/lib/display-name";

export default function CustomerAddressesPage() {
  return (
    <Suspense fallback={<p className="p-6">A carregar moradas…</p>}>
      <CustomerAddressesContent />
    </Suspense>
  );
}

async function CustomerAddressesContent() {
  await connection();
  const session = await getAppSession();
  const addresses = session
    ? await prisma.address.findMany({
        where: { userId: session.user.id, deletedAt: null },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : [];
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">As minhas moradas</h2>
        <p>Guarde os dados para facilitar as próximas compras.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <article className="rounded-xl border bg-white p-4" key={address.id}>
            <strong>
              {displayName(address.label)}
              {address.isDefault ? " · Principal" : ""}
            </strong>
            <p>
              {displayName(address.recipientName)} · {address.phone}
            </p>
            <p>
              {displayName(address.neighborhood)},{" "}
              {displayName(address.district)}, {displayName(address.province)}
            </p>
            {address.street ? <p>{displayName(address.street)}</p> : null}
            <p className="text-muted-foreground text-sm">
              Referência: {displayName(address.reference)}
            </p>
          </article>
        ))}
      </div>
      <AddressForm />
    </section>
  );
}
