# Design system Agroconet — Fase 4

Estado: Fase 4 implementada e aprovada. A logo oficial fornecida pelo utilizador foi integrada em 2026-10-22; as fases 5 e 6 já foram iniciadas.

## Logo oficial — 2026-10-22

O ficheiro original transparente, `public/images/agroconet-logo.png` (1269 × 1240), foi fornecido pelo utilizador. O componente partilhado `Brand` apresenta a assinatura principal recortada visualmente para caber no cabeçalho e mantém a imagem original intacta. `src/app/icon.svg` usa o símbolo agrícola da mesma imagem; o ícone Apple aponta para o PNG original.

## Revisão visual 02 — 2026-10-22

A primeira proposta foi rejeitada pelo utilizador. A direcção actual substitui a aparência anterior: fundo linho #fbfaf6, verde folha #7bc543, floresta #123b2a, superfícies verde-sálvia #e6f1d5 e terra #f0c5ae. Verde folha usa texto escuro; floresta permanece em navegação, cabeçalhos e acções principais para contraste. DM Sans ganha protagonismo nos títulos fortes e Lora fica nos destaques editoriais em itálico. A marca usa agora o logótipo oficial fornecido pelo utilizador, com botões arredondados e autenticação com composição fotográfica lateral em desktop.

O guia interno foi redesenhado como uma apresentação da identidade com hero, amostras de categorias, paleta e componentes. Continua a ser apenas a Fase 4; não constitui implementação do catálogo ou landing com BD. Os links do guia navegam para secções internas. A fotografia em `public/images/agro-editorial.png` foi gerada com imagegen, é ilustrativa e não representa cliente, colaborador ou exploração verificados. O alt identifica essa origem. Substituir por fotografia própria quando disponível.

Animações discretas de entrada e hover respeitam a preferência de redução de movimento. Guia verificado em desktop (1360 px) e mobile (360 px), sem transbordo horizontal. A identidade visual foi aprovada pelo utilizador ao avançar para a Fase 5.

## Identidade anterior (histórico; substituída pela revisão 02)

Lora nos títulos de marca (`font-heading`); DM Sans na interface (`font-sans`). Fontes descarregadas no build por next/font e servidas pela aplicação. Build inicial requer acesso a Google Fonts.

Os tokens ficam em `src/app/globals.css`. Verde floresta #0d3b22, fundo #f3faf5, dourado #f2b134. O verde de acção #116f38 suporta texto branco com contraste AA; #168a45 fica para detalhes gráficos (não usar texto branco pequeno sobre esta cor). Dourado usa texto escuro. Tokens `.dark` preparados; a interface actual e as notificações usam tema claro. Não existe selector de tema nesta fase.

Usar tokens semânticos (`bg-card`, `text-muted-foreground`, `border-input`, `ring-ring`) em vez de hex em features. Foco visível e redução de movimento estão definidos na base CSS. Controlos de acção têm altura mínima de 44 px; checkbox/radio/switch devem ser acompanhados por labels com espaço de toque. É necessária revisão de teclado e contraste em cada composição futura.

## Componentes

Primitivos em `src/components/ui`: input, label, textarea, card, badge, dialog, alert-dialog, dropdown-menu, select, checkbox, radio-group, switch, table, tabs, separator, skeleton, sonner, sheet, scroll-area, tooltip, avatar, breadcrumb, pagination, popover e button.

Composição Base UI: `render={<Link href="…" />}` com `nativeButton={false}` em Button usado como link. Não usar `asChild`. Todos os primitivos usam o helper `cn` de `@/lib/utils` (clsx + tailwind-merge).

Compostos em `src/components/shared`:

- `PageHeader`: título, descrição, eyebrow opcional e acção.
- `EmptyState` e `ErrorState`: mensagens explícitas e acção opcional; erro com role alert.
- `PriceTag`: recebe `cents` inteiros seguros, formata com Intl pt-MZ/MZN; rejeita fraccionários, NaN e infinito. Não altera o armazenamento em centavos.
- `StatusBadge`: tom semântico e rótulo de texto; não depende só da cor. O chamador traduz o estado de domínio.
- `DataTable<T>`: colunas tipadas, rowKey, caption e estado vazio; scroll horizontal no contentor da tabela. Sem pesquisa, ordenação ou paginação nesta fase.

## Layouts

A loja tem Brand, header com acesso à autenticação, footer e salto para conteúdo. Admin/vendedor usam sidebar em desktop e navegação horizontal em mobile. O entregador tem shell estreito e navegação inferior com safe-area. Apenas rotas existentes aparecem na navegação; funcionalidades de domínio continuam nas fases correspondentes.

`AreaShell` exige `area` (admin, vendedor, entregador ou cliente). Os quatro layouts mantêm `requireAreaSession` dentro de componente assíncrono protegido por Suspense. `AreaLoading` é o fallback; nenhuma sessão é colocada em cache partilhada.

## Como validar

1. Executar `npm run dev` e abrir http://localhost:3000/design-system. O guia só existe em development; production responde 404.
2. Rever cores, tipografia, botões, formulários, select, checkbox, switch, diálogo, sheet, tabs, tabela, skeleton e feedback toast. Dados do guia são fictícios e não são gravados.
3. Rever a 360 px e desktop; navegar com Tab, abrir diálogo/drawer e fechar com Escape, confirmar retorno do foco.
4. Com PostgreSQL activo e seed disponível, entrar nas contas de cada papel e rever `/admin`, `/vendedor`, `/entregador`, `/cliente`.
5. Executar `npm run typecheck`, `npm run lint`, `npx vitest run tests/unit` e `npm run build`. Com BD activa, executar também `npm test`.

Validação original da Fase 4: build, lint, tipos e formatação passaram; 43 testes unitários passaram; guia observado em desktop e 360 px sem overflow horizontal. Diálogo e sheet abrem e recebem foco no controlo de fecho/acção. Naquela execução, a BD estava indisponível; mais tarde a suite completa passou com a BD activa. Os shells autenticados ainda não foram revistos visualmente com sessão.

Aprovação visual já recebida. A revisão autenticada dos shells continua recomendada para as fases correspondentes. A landing foi implementada na Fase 5; Lighthouse e fotografia real continuam pendentes, conforme `ROADMAP.md`.
