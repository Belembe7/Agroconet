import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";

export function Brand() {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className="brand-lockup inline-flex items-center gap-2 font-bold tracking-normal"
    >
      <Image
        src="/images/agroconet-logo.png"
        alt=""
        width={80}
        height={80}
        sizes="64px"
        priority
        className="brand-lockup-image h-16 w-16 shrink-0 object-contain"
      />
      <span className="text-base">{siteConfig.name}</span>
    </Link>
  );
}
