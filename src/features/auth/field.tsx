"use client";

import { Input } from "@/components/ui/input";

export function AuthField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  minLength,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-foreground font-medium">{label}</span>
      <Input
        className="w-full"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
