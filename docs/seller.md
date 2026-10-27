# Fase 9 — Área do vendedor

## Entregue

- Dashboard autenticado com estado do perfil, total de produtos activos, encomendas pendentes e valores líquidos/comissões calculados a partir de `Commission`.
- Gestão do perfil comercial: nome comercial/legal, telefone, província, distrito, morada de recolha e descrição.
- Criação de produto com uma variante inicial, SKU, preço, unidade, tamanho e stock de abertura. Produtos submetidos entram em `PENDING_REVIEW` e só o fluxo administrativo pode activá-los.
- Edição dos dados de produto e variante principal. A edição reenvia o produto para revisão e limpa os dados de decisão anteriores.
- Ajustes positivos e negativos de stock limitados ao catálogo do vendedor. Toda alteração usa `InventoryService`, preserva reservas e cria movimento de inventário com autor e motivo.
- Lista das encomendas do vendedor, itens, contacto e valores. As acções permitem confirmar ou recusar uma encomenda pendente e marcar uma encomenda confirmada como pronta para recolha.
- As queries e mutações recebem o actor da sessão e verificam propriedade no serviço. A autenticação também é repetida em cada Server Action, pois acções são endpoints invocáveis por POST.

## Pendências / dependências

- Upload de imagens: não implementado. O repositório ainda não tem `StorageProvider`, credenciais ou fluxo de upload privado; não foram aceites URLs arbitrários como substituto.
- Candidatura de vendedor: o modelo `Seller` existe, mas a área protegida só é atribuída a utilizadores com papel `SELLER`. Não há formulário de candidatura pública nem processo de concessão do papel nesta fase implementada.
- O fluxo de pedidos permite estados até `READY_FOR_PICKUP`; recolha, entrega, cancelamento operacional, notificações e liquidação pertencem às fases de logística/notificações/pagamentos.
- A edição disponibilizada cobre o produto e a primeira variante. Gestão de múltiplas variantes, remoção/arquivamento e imagens pode ser expandida sem alterar o schema actual.
- Não foram necessárias alterações ao schema nem migrations.

## Validação

`npx tsc --noEmit` passou pelas alterações do vendedor sem erros; a execução terminou com erros em `src/app/(storefront)/cliente/pedidos/[id]/page.tsx` (tipagem de rota/`params`). Testes não foram executados.
