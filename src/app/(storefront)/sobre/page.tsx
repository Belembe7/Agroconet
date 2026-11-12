import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AboutPage } from "@/features/landing/farmbity-public-pages";
import { getSiteLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Sobre a Agroconet",
  description:
    "Conheça a Agroconet, marketplace agropecuário com coordenação de entregas em Maputo e Matola.",
};

export default function AboutRoute() {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  return <AboutPage locale={await getSiteLocale()} />;
}
