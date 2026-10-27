import type { ReactNode } from "react";
import { Sprout } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-card flex flex-col items-center rounded-xl border border-dashed p-8 text-center sm:p-12">
      <Sprout aria-hidden="true" className="text-primary mb-4 size-9" />
      <h2 className="font-heading text-2xl">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
