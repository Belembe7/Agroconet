import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HowItWorksPage } from "@/features/landing/farmbity-public-pages";
import { getSiteLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Conheça as etapas para comprar, vender e acompanhar entregas na Agroconet.",
};

export default function HowItWorksRoute() {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <HowItWorksContent />
    </Suspense>
  );
}

async function HowItWorksContent() {
  return <HowItWorksPage locale={await getSiteLocale()} />;
}
