import Image from "next/image";
import type { ProductImageAsset } from "@/lib/product-image";

export function ProductFallbackPhoto({
  asset,
  name,
  sizes,
  className,
  priority,
}: {
  asset: ProductImageAsset;
  name: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={asset.src}
      alt={name}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}
