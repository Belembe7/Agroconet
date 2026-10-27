import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-secondary text-secondary-foreground",
  warning: "bg-accent text-accent-foreground",
  danger: "bg-destructive/10 text-destructive",
};
export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <Badge className={cn("gap-1.5 border-transparent", tones[tone])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </Badge>
  );
}
