"use client";

import { useActionState, type ReactNode } from "react";
import { toast } from "sonner";

type FeedbackState = {
  kind: "success" | "error";
  message: string;
};

type ActionFeedbackFormProps = {
  action: (formData: FormData) => Promise<unknown>;
  children: ReactNode;
  className?: string;
  successMessage: string;
  errorMessage?: string;
  pendingMessage?: string;
};

export function ActionFeedbackForm({
  action,
  children,
  className,
  successMessage,
  errorMessage = "Não foi possível concluir esta ação. Verifique os dados e tente novamente.",
  pendingMessage = "A processar…",
}: ActionFeedbackFormProps) {
  const [feedback, formAction, pending] = useActionState(
    async (_previous: FeedbackState | null, formData: FormData) => {
      try {
        await action(formData);
        toast.success(successMessage);
        return { kind: "success", message: successMessage } as const;
      } catch {
        toast.error(errorMessage);
        return { kind: "error", message: errorMessage } as const;
      }
    },
    null,
  );

  return (
    <form action={formAction} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {(pending || feedback) && (
        <p
          className={`col-span-full basis-full text-sm ${
            feedback?.kind === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
          role={feedback?.kind === "error" ? "alert" : "status"}
          aria-live={feedback?.kind === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {pending ? pendingMessage : feedback?.message}
        </p>
      )}
    </form>
  );
}
