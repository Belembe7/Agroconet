import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";

export function Brand() {
  return (
    <Link href="/" aria-label={siteConfig.name} className="brand-lockup">
      <Image
        src="/images/agroconet-logo.png"
        alt=""
        width={1269}
        height={1240}
        sizes="110px"
        className="brand-lockup-image"
      />
    </Link>
  );
}
