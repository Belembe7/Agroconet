import { Suspense, type ReactNode } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";
export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<div className="storefront-frame">{children}</div>}>
      <StorefrontShell>{children}</StorefrontShell>
    </Suspense>
  );
}
