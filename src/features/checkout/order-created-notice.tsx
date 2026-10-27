"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export function OrderCreatedNotice({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    toast.success(`Pedido ${orderNumber} feito com sucesso.`);
    router.replace(pathname, { scroll: false });
  }, [orderNumber, pathname, router]);

  return null;
}
