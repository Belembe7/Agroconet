"use client";

import { useId, useState, type ComponentProps, type FormEvent } from "react";
import { Input } from "@/components/ui/input";

type NumericInputProps = Omit<ComponentProps<typeof Input>, "type">;

function getValidationMessage(input: HTMLInputElement) {
  const { validity } = input;

  if (validity.badInput) return "Introduza apenas números neste campo.";
  if (validity.valueMissing) return "Este campo é obrigatório.";
  if (validity.rangeUnderflow || validity.rangeOverflow) {
    return "O valor está fora do intervalo permitido.";
  }
  if (validity.stepMismatch) {
    return "Use o formato numérico permitido neste campo.";
  }

  return null;
}

export function NumericInput({
  className,
  onBlur,
  onInput,
  onInvalid,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: NumericInputProps) {
  const errorId = useId();
  const [message, setMessage] = useState<string | null>(null);
  const invalid =
    Boolean(message) || ariaInvalid === true || ariaInvalid === "true";

  function updateMessage(event: FormEvent<HTMLInputElement>) {
    setMessage(getValidationMessage(event.currentTarget));
  }

  return (
    <span className="numeric-input-field">
      <Input
        {...props}
        type="number"
        className={className}
        aria-invalid={invalid || undefined}
        aria-describedby={
          [describedBy, message ? errorId : null].filter(Boolean).join(" ") ||
          undefined
        }
        onInput={(event) => {
          updateMessage(event);
          onInput?.(event);
        }}
        onBlur={(event) => {
          updateMessage(event);
          onBlur?.(event);
        }}
        onInvalid={(event) => {
          updateMessage(event);
          onInvalid?.(event);
        }}
      />
      {message ? (
        <span id={errorId} className="numeric-input-error" role="status">
          {message}
        </span>
      ) : null}
    </span>
  );
}
