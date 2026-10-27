import type { ComponentProps } from "react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceTag({
  cents,
  className,
  ...props
}: ComponentProps<"span"> & { cents: number }) {
  return (
    <span
      className={cn("font-semibold whitespace-nowrap tabular-nums", className)}
      {...props}
    >
      {formatPrice(cents)}
    </span>
  );
}
