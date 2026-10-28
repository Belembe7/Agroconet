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
  if (asset.position) {
    return (
      <div
        role="img"
        aria-label={`Imagem ilustrativa de ${name}`}
        className={`absolute inset-0 bg-[#f6f0e5] ${className ?? ""}`}
        style={{
          backgroundImage: `url('${asset.src}')`,
          backgroundPosition: asset.position,
          backgroundRepeat: "no-repeat",
          backgroundSize: "200% 200%",
        }}
      />
    );
  }

  return (
    <Image
      src={asset.src}
      alt={`Imagem ilustrativa de ${name}`}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}
