import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export function ErrorState({
  title = "Não foi possível carregar",
  description = "Verifique a ligação e tente novamente.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-card rounded-xl border p-6"
    >
      <CircleAlert
        aria-hidden="true"
        className="text-destructive mb-3 size-6"
      />
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
