import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactPage } from "@/features/landing/farmbity-public-pages";
import { getSiteLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Contactos",
  description: "Contacte a equipa Agroconet para obter apoio.",
};

export default function ContactRoute() {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <ContactContent />
    </Suspense>
  );
}

async function ContactContent() {
  return <ContactPage locale={await getSiteLocale()} />;
}
