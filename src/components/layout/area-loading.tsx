import { Skeleton } from "@/components/ui/skeleton";
export function AreaLoading() {
  return (
    <div role="status" className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <span className="sr-only">A carregar a sua área…</span>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
