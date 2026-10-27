"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceTag } from "@/components/shared/price-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DataTable } from "@/components/shared/data-table";

export function DesignSystemDemo() {
  return (
    <div className="space-y-12">
      <section aria-labelledby="actions" className="space-y-5">
        <h2 id="actions" className="font-heading text-2xl">
          Acções e feedback
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => toast.success("Exemplo guardado com sucesso.")}
          >
            Guardar exemplo
          </Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Discreto</Button>
          <Button variant="destructive">Eliminar</Button>
          <Button disabled>Indisponível</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge tone="success">Confirmado</StatusBadge>
          <StatusBadge tone="warning">Pendente</StatusBadge>
          <StatusBadge tone="danger">Cancelado</StatusBadge>
          <StatusBadge>Rascunho</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Abrir diálogo
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar alteração</DialogTitle>
                <DialogDescription>
                  Este é um exemplo de diálogo. Nenhum dado será alterado.
                </DialogDescription>
              </DialogHeader>
              <DialogClose render={<Button />}>Concluir</DialogClose>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>
              Abrir painel móvel
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros de exemplo</SheetTitle>
                <SheetDescription>
                  Estrutura reutilizável para os próximos passos da loja.
                </SheetDescription>
              </SheetHeader>
              <p className="text-muted-foreground px-4 text-sm">
                O catálogo será implementado na Fase 6.
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </section>
      <section aria-labelledby="fields" className="space-y-5">
        <h2 id="fields" className="font-heading text-2xl">
          Formulários
        </h2>
        <div className="bg-card grid gap-6 rounded-xl border p-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="demo-name">Nome</Label>
            <Input id="demo-name" placeholder="O seu nome" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-zone">Zona de exemplo</Label>
            <Select
              defaultValue="maputo"
              items={{ maputo: "Maputo", matola: "Matola" }}
            >
              <SelectTrigger id="demo-zone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maputo">Maputo</SelectItem>
                <SelectItem value="matola">Matola</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-note">Observações</Label>
            <Textarea id="demo-note" placeholder="Escreva uma observação…" />
          </div>
          <div className="space-y-4">
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox id="demo-check" />
              <Label htmlFor="demo-check">Aceitar condição de exemplo</Label>
            </div>
            <div className="flex min-h-11 items-center gap-3">
              <Switch id="demo-switch" />
              <Label htmlFor="demo-switch">Receber novidades</Label>
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="data" className="space-y-5">
        <h2 id="data" className="font-heading text-2xl">
          Informação e estados
        </h2>
        <Tabs defaultValue="table">
          <TabsList aria-label="Exemplos de apresentação">
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="loading">A carregar</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <DataTable
              caption="Dados fictícios para demonstração visual; não representam encomendas."
              rowKey={(row) => row.id}
              rows={[
                { id: "EX-001", cents: 125050 },
                { id: "EX-002", cents: 78000 },
              ]}
              columns={[
                { id: "id", label: "Referência", cell: (row) => row.id },
                {
                  id: "price",
                  label: "Total",
                  cell: (row) => <PriceTag cents={row.cents} />,
                },
                {
                  id: "status",
                  label: "Estado",
                  cell: () => <StatusBadge tone="warning">Exemplo</StatusBadge>,
                },
              ]}
            />
          </TabsContent>
          <TabsContent value="loading">
            <div
              role="status"
              className="bg-card space-y-3 rounded-xl border p-6"
            >
              <span className="sr-only">A carregar…</span>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </TabsContent>
        </Tabs>
        <div className="grid gap-5 lg:grid-cols-2">
          <EmptyState
            title="Tudo começa aqui"
            description="Quando houver registos, encontrará aqui a informação de que precisa."
          />
          <ErrorState
            action={
              <Button
                variant="outline"
                onClick={() => toast.info("Nova tentativa de demonstração.")}
              >
                Tentar novamente
              </Button>
            }
          />
        </div>
      </section>
    </div>
  );
}
