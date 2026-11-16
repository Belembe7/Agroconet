import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";
import { PageBackButton } from "@/components/layout/page-back-button";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-experience">
      <div className="auth-form-side">
        <header>
          <Brand />
          <PageBackButton
            containerClassName="contents"
            className="auth-back border-0 bg-transparent px-0"
          />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
