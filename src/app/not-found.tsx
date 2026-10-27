import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground mt-2">
        O endereço pedido não existe.
      </p>
      <Button className="mt-6" nativeButton={false} render={<Link href="/" />}>
        Voltar ao início
      </Button>
    </main>
  );
}
