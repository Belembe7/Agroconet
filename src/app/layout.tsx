import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Lora } from "next/font/google";
import { env } from "@/lib/env";
import { siteConfig } from "@/config/site";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const uiFont = DM_Sans({
  display: "optional",
  variable: "--font-ui",
  subsets: ["latin"],
});

const brandFont = Lora({
  display: "optional",
  weight: "400",
  style: "italic",
  preload: false,
  variable: "--font-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: { icon: "/icon.svg", apple: "/images/agroconet-logo.png" },
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt"
      className={`${uiFont.variable} ${brandFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-right" closeButton />
      </body>
    </html>
  );
}
