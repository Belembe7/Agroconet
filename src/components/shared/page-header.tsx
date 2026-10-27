import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-3">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
