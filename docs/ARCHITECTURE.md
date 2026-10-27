# Agroconet — Arquitetura (Fase 0)

> Estado: **proposta para validação**. Nenhum código foi escrito.
> Versões exatas de bibliotecas são fixadas na Fase 1, verificando a documentação oficial nessa altura.

---

## 1. Visão geral do sistema

A Agroconet é um marketplace multi-vendedor de insumos agropecuários com logística própria de entrega.

```
CLIENTE ──► CATÁLOGO ──► CARRINHO ──► CHECKOUT ──► PAGAMENTO
                                                     │
                              ┌──────────────────────┘
                              ▼
                    ENCOMENDA (1 por compra)
                              │  divisão operacional
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
          SellerOrder A  SellerOrder B  SellerOrder C    (1 por vendedor)
                │             │             │
                ▼             ▼             ▼
            Delivery A    Delivery B    Delivery C       (1 por recolha)
                │             │             │
                └──── ENTREGADORES ─────────┘──► CLIENTE
                      ▲
            ADMIN supervisiona e intervém em tudo
```

### 1.1 O que os documentos de referência dizem

**Proposta (PDF)** — define 4 perfis (cliente, vendedor, entregador, administrador), 5 áreas (marketplace, vendedores, logística, painel admin, notificações) e pede: aprovação de vendedores e produtos, comissões, stock com histórico, pagamentos moçambicanos (M-Pesa, e-Mola, cartão, pagamento na entrega), confirmação de entrega (foto, assinatura, código), funcionamento com internet limitada, notificações por SMS.

**HTML atual** — fornece a identidade inicial:

| Elemento | Valor no HTML | Como será usado |
|---|---|---|
| Marca | AGROCONET — "Soluções Agropecuárias ao seu alcance!" | Mantido como slogan |
| Cores | verde `#168a45`, verde escuro `#0d3b22`, claro `#f3faf5`, dourado `#f2b134` | Ponto de partida para os design tokens (refinados na Fase 4) |
| Categorias | Sementes, Fertilizantes, Cereais, Pesticidas, Produtos veterinários, Repelentes, Produtos de jardim, Produtos agrícolas | Base da taxonomia (ver 1.2) |
| Cobertura | Entregas em Maputo e Matola; outras províncias "mediante transporte" | Define as zonas de entrega iniciais |
| Canal atual | WhatsApp, atendimento rápido | Mantido como canal complementar (botão de contacto), não como fluxo de compra |
| Contactos/morada | Maputo / KaTembe, 2 telefones, email | Vão para `SystemSetting` (BD), não hardcoded |

### 1.2 Divergências entre os documentos (precisam de decisão)

1. **Categorias**: HTML tem 8, o briefing lista 10 (acrescenta Ferramentas, Equipamentos agrícolas, Ração animal e não tem Veterinários/Produtos agrícolas como nome), o PDF fala em "defensivos agrícolas" em vez de "pesticidas". Proposta: taxonomia em árvore (categoria → subcategoria) gerida pelo admin, com seed inicial que reconcilia as três fontes. Ver decisão D4.
2. **Aplicação móvel do cliente**: o PDF descreve uma app móvel; o briefing diz web responsiva primeiro e React Native "numa fase posterior". Proposta: **PWA** (instalável, cache offline básico) cobre a fase inicial. Ver D1.
3. **Entregas para outras províncias**: o HTML trata-as como "mediante transporte". Não cabem no modelo de entregador local. Proposta: tratar como **envio por transportadora, com cotação manual**, fora do MVP. Ver D5.

---

## 2. Princípios de arquitetura

1. **Monólito modular** — um deploy, fronteiras internas claras por domínio. Extrair serviços só quando houver dor real.
2. **PostgreSQL é a única fonte de verdade**, também para filas (ver 3.3), evitando Redis no início.
3. **Regras de negócio em `services`**, nunca em componentes, `page.tsx` ou route handlers. Handlers e Server Actions só autenticam, validam (Zod), chamam o service e formatam a resposta.
4. **Autorização sempre no servidor**, em duas camadas: permissão por papel + verificação de propriedade do recurso (ex.: o vendedor só toca nos seus produtos).
5. **Dinheiro em inteiros (centavos de MZN)**, nunca `float`.
6. **Máquinas de estado explícitas** para Order, SellerOrder, Delivery e Payment; transições numa única função por entidade.
7. **Idempotência** em pagamentos, webhooks e criação de encomendas.
8. **Auditoria** das operações sensíveis através de um único `AuditService`.
9. **Snapshots** em itens de encomenda (preço, nome, comissão) para que alterações futuras do catálogo não reescrevam o histórico.
10. **Mobile-first e baixa largura de banda**: Server Components, imagens otimizadas, JS mínimo nas páginas públicas.

---

## 3. Arquitetura recomendada

### 3.1 Alternativas consideradas

| Opção | Vantagens | Desvantagens | Veredicto |
|---|---|---|---|
| **A. Monólito modular em Next.js** (recomendada) | Um deploy, tipos partilhados, menos infraestrutura, mais rápido de iterar | Requer disciplina para manter fronteiras; worker exige processo longo | ✅ Escolhida |
| B. Next.js (frontend) + API separada (NestJS/Fastify) | Backend reutilizável por app nativa, deploy independente | Dobra a infraestrutura, duplicação de tipos/validação, mais lento no início | ❌ Prematura; migração possível depois porque os services são independentes do Next |
| C. Microsserviços | Escala independente | Complexidade operacional desproporcional | ❌ Rejeitada |

A opção A mantém a porta aberta para B: como os `services` não importam nada do Next.js, podem ser expostos depois como API versionada para a app React Native.

### 3.2 Diagrama lógico

```
        Browser / PWA (cliente, vendedor, admin, entregador)
                          │
┌─────────────────────────▼──────────────────────────────┐
│ Next.js (App Router)                                   │
│  Route groups: (storefront) (auth) (painel) (entregador)│
│  Server Components · Server Actions · Route Handlers   │
│        │ validação Zod + autenticação + permissões     │
│        ▼                                               │
│  Services de domínio (catalog, cart, checkout, orders, │
│  inventory, payments, logistics, notifications, audit) │
│        │                                               │
│  Repositórios/Prisma                                   │
└────────┬───────────────────────────────┬───────────────┘
         ▼                               ▼
   PostgreSQL ◄──────────── Worker (pg-boss, processo separado)
   (dados + filas)                       │
                                         ▼
        Adapters externos: PaymentProvider · SmsProvider ·
        EmailProvider · StorageProvider · MapsProvider
```

### 3.3 Jobs em segundo plano (worker)

Necessários para: libertar reservas de stock expiradas, reenviar notificações, processar webhooks, alertas de stock baixo, atribuição automática de entregadores, fecho de payouts.

- Recomendação: **pg-boss** (filas sobre PostgreSQL). Sem Redis.
- O worker é um processo Node separado no mesmo repositório (`src/worker`). Em desenvolvimento corre com `npm run worker`.
- Alternativa: Redis + BullMQ (mais potente, mais infraestrutura); Vercel/Hostinger cron (insuficiente para filas com retry). Ver secção 14 sobre as limitações de hospedagem.

### 3.4 Duas interfaces no mesmo projeto (a tua proposta)

Concordo com a separação e refino-a em **três** áreas, todas dentro do mesmo projeto Next.js, como route groups com layouts, guardas e bundles próprios:

| Área | Utilizadores | Rotas | Característica |
|---|---|---|---|
| **Storefront** (web pública + marketplace + conta do cliente) | visitantes, clientes | `/`, `/produtos`, `/carrinho`, `/checkout`, `/cliente/*` | SEO, SSR/ISR, leve, mobile-first |
| **Painel** (vendedor + admin) | vendedores, admins | `/vendedor/*`, `/admin/*` | Autenticado, tabelas/gráficos, desktop-first mas usável em tablet; `noindex` |
| **Entregador** | entregadores | `/entregador/*` | Mobile-first, PWA, botões grandes, pouco JS |

Regras para evitar acoplamento:
- Cada área só importa de `features/*`, `components/ui` e `lib/*`; **nunca** de outra área.
- A proteção é feita em **três níveis**: middleware (redirecionamento rápido), layout do grupo (verifica sessão/papel) e **cada service** (autorização definitiva).
- Se mais tarde se quiser `painel.agroconet.co.mz`, basta routing por host no middleware, sem reescrever código.

Vendedor e admin partilham o "shell" de painel (sidebar, tabelas, filtros), mas têm páginas e permissões distintas.

### 3.5 Server Actions vs Route Handlers

- **Server Actions**: formulários e mutações das nossas próprias páginas (adicionar ao carrinho, guardar produto, aprovar vendedor).
- **Route Handlers**: webhooks de pagamento, uploads (URLs pré-assinados), endpoints consumidos por clientes externos ou futura app nativa, healthcheck, sitemap.
- Ambos chamam **os mesmos services**, nunca duplicam lógica.

---

## 4. Stack final

| Camada | Escolha | Nota |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript `strict` | Versão estável mais recente na Fase 1 |
| UI | Tailwind CSS + shadcn/ui + Lucide | Tokens de design próprios (Fase 4) |
| Formulários | React Hook Form + `@hookform/resolvers/zod` | Schemas Zod partilhados cliente/servidor |
| Validação | Zod | Em todas as fronteiras (input, env, webhooks) |
| BD | PostgreSQL | Extensões: `pg_trgm`, `unaccent` para pesquisa |
| ORM | Prisma | SQL cru apenas para constraints e operações atómicas de stock |
| Estado cliente | Zustand **apenas** para UI efémera (drawer do carrinho, filtros móveis). O carrinho vive no servidor | Evita duplicar a verdade |
| Jobs | pg-boss | Ver 3.3 |
| Autenticação | **ver D2** (recomendação: Better Auth) | Identificador principal: telemóvel |
| Imagens | **ver D6** (recomendação: Cloudinary no MVP atrás de `StorageProvider`) | |
| Mapas | **ver D7** (recomendação: pin no mapa + referência textual; links de navegação) | |
| Pesquisa | PostgreSQL full-text (`portuguese` config) + `pg_trgm` | Sem Elasticsearch |
| Gráficos | Recharts (via shadcn charts) | Só no painel |
| Testes | Vitest (unit/integração), Playwright (E2E) | |
| Qualidade | ESLint, Prettier, TypeScript strict, Husky + lint-staged | |
| CI | GitHub Actions | Ver 13 |
| Mobile | React Native + Expo, **fase posterior** | PWA até lá |

Não entram: Redux, GraphQL, tRPC, Elasticsearch, Redis, microsserviços, CMS externo. Reavaliamos se surgir necessidade concreta.

---

## 5. Papéis e permissões (resumo)

`SUPER_ADMIN`, `ADMIN`, `SELLER`, `CUSTOMER`, `DRIVER`. Um utilizador pode ter **mais de um papel** (ex.: cliente e vendedor com a mesma conta). Matriz completa, regras de propriedade e aplicação no servidor estão em **SECURITY.md**.

---

## 6. Fluxos principais

### 6.1 Registo e aprovação de vendedor
1. Utilizador cria conta (`CUSTOMER`) → pede para vender → preenche dados do negócio e envia documentos (`Seller.status = PENDING`).
2. Admin revê (`APPROVED` | `REJECTED` com motivo) → `AuditLog` + notificação.
3. Só com `APPROVED` ganha o papel `SELLER` e acesso a `/vendedor`. O vendedor **nunca** aprova o próprio registo (service verifica `actor != seller.user`).

### 6.2 Publicação de produto
`DRAFT → PENDING_REVIEW → ACTIVE | REJECTED`; `ACTIVE ⇄ INACTIVE`; `ARCHIVED` (soft delete). A aprovação de produtos é configurável em `SystemSetting` (`products.requireApproval`). Alteração de preço ou stock gera `AuditLog` e, no stock, `InventoryMovement`.

### 6.3 Compra (checkout)
1. Carrinho (na BD para utilizadores autenticados; cookie para visitantes, fundido no login).
2. Checkout em 6 etapas (dados → endereço → entrega → pagamento → revisão → confirmação). O estado do checkout é guardado no servidor (`CheckoutSession`) para permitir retoma.
3. Ao confirmar, **numa única transação**: revalidar preços e stock → criar `Order` + `SellerOrder`s + `OrderItem`s (com snapshots) → criar `StockReservation` (TTL) → calcular taxas de entrega e comissões → criar `Payment` (PENDING).
4. Pagamento conforme provider (ver 9). Sucesso → reservas convertidas em `SALE` no stock → `Order = CONFIRMED` → notificações.
5. Falha/expiração → reservas libertadas pelo worker.

### 6.4 Processamento por vendedor
`SellerOrder`: `PENDING → CONFIRMED → READY_FOR_PICKUP → PICKED_UP → DELIVERED`. O vendedor vê apenas os seus `SellerOrder`s. Pode recusar (`REJECTED`) dentro de um prazo; o admin decide reatribuição ou reembolso parcial.

### 6.5 Entrega
Ver 8. Ao `DELIVERED`: atualiza `SellerOrder`, cria `DriverEarning`, e agenda comissão/payout do vendedor (após período de retenção configurável).

### 6.6 Cancelamento e reembolso
Regras por estado: antes de `PICKED_UP`, cancelamento devolve stock (`CANCELLED_ORDER`) e dispara reembolso conforme o provider (M-Pesa/e-Mola podem exigir reembolso manual pelo admin — ver riscos). Após recolha, é tratado como devolução (`RETURN`), decisão do admin.

---

## 7. Arquitetura do marketplace

### 7.1 Catálogo
- `Product` (conteúdo: nome, descrição, categoria, vendedor) + `ProductVariant` (unidade vendável: SKU, embalagem/unidade, preço, stock). Motivo: insumos agrícolas vendem-se em formatos (saco 25 kg, 1 L, 5 L). Um produto simples tem uma variante por defeito. Ver D3.
- Categorias em árvore (auto-relação), geridas pelo admin.
- Slugs únicos e estáveis (`/produtos/[slug]`); histórico de slug se mudar (redirect 301).

### 7.2 Pesquisa e filtros
- Filtros: texto, categoria/subcategoria, preço, vendedor, disponibilidade, avaliação, ordenação, paginação.
- Estado dos filtros **na URL** (`searchParams`) → partilhável e indexável.
- Texto: `tsvector` + `pg_trgm` (tolerância a erros de escrita) com `unaccent`.
- Paginação por cursor em listagens grandes, offset nas páginas de categoria indexáveis.

### 7.3 Carrinho multi-vendedor
- Agrupado por vendedor para mostrar entrega por pacote.
- Nunca guarda preço: lê sempre o preço atual; o snapshot só é criado na encomenda.
- Validação de stock no carrinho (aviso) e no checkout (bloqueio).

### 7.4 Divisão da encomenda (Order + SellerOrder + OrderItem)
Comparámos:

| Modelo | Problema |
|---|---|
| Só `Order` + `OrderItem` | Filtrar/estado/entrega/comissão por vendedor exige agrupamentos constantes e torna o estado por vendedor impossível |
| **`Order` + `SellerOrder` + `OrderItem` (recomendado)** | Mais uma tabela, mas estado, entrega, comissão e payout por vendedor ficam naturais |

- `Order`: o que o cliente vê (um número, um total, um pagamento).
- `SellerOrder`: a unidade operacional de cada vendedor (seu estado, sua entrega, sua comissão).
- `OrderItem` pertence ao `SellerOrder`.
- Estado do `Order` é **derivado** dos `SellerOrder`s (ex.: `PARTIALLY_DELIVERED`).

### 7.5 Comissões
Taxa em pontos-base (bps), resolvida por: regra da categoria → regra do vendedor → padrão em `SystemSetting`. Guardada como **snapshot** no `OrderItem`. `Commission` agrega por `SellerOrder`; `SellerPayout` liquida conjuntos de comissões.

---

## 8. Arquitetura da logística

### 8.1 Modelo
- `DeliveryZone`: polígono simples ou lista de bairros/distritos (Maputo cidade, KaTembe, Matola…), com taxa de entrega base.
- `Driver`: veículo, zonas de atuação, disponibilidade, documentos.
- `Delivery`: 1 por `SellerOrder` (uma recolha → um destino). Campos: origem (vendedor), destino (endereço do cliente), entregador, estado, código de confirmação, prova (foto/assinatura), datas por etapa.
- `DeliveryStatusHistory`: cada transição com autor, hora e (opcional) coordenadas.
- `DriverLocation`: tabela preparada mas **não usada** no MVP (sem GPS contínuo).

### 8.2 Estados da entrega
`UNASSIGNED → ASSIGNED → ACCEPTED → EN_ROUTE_TO_PICKUP → PICKED_UP → EN_ROUTE_TO_CUSTOMER → DELIVERED`
Saídas: `FAILED` (cliente ausente, recusa — com motivo), `CANCELLED`. Recusa do entregador → volta a `UNASSIGNED`.

### 8.3 Atribuição
Interface `AssignmentStrategy` com duas implementações:
1. **Manual** (MVP): admin atribui a partir de uma lista de entregadores disponíveis na zona.
2. **Automática** (fase posterior): filtra por zona + disponibilidade + carga atual; oferece ao primeiro; se não aceitar em X minutos, passa ao seguinte. Corre no worker.

### 8.4 Entrega multi-vendedor
No MVP, cada `SellerOrder` gera uma entrega independente (o cliente recebe vários pacotes, possivelmente em horas distintas) e a taxa de entrega é calculada por entrega. Isto é o mais simples e robusto. Alternativas (consolidação num hub da Agroconet em KaTembe, ou uma rota com várias recolhas) ficam para evolução. **Decisão D5.**

### 8.5 Confirmação
Configurável em `SystemSetting`: código de 4–6 dígitos enviado ao cliente (recomendado como padrão, funciona sem câmara), foto, assinatura. Validação do código feita no servidor com limite de tentativas.

### 8.6 Rotas e mapas
MVP: o entregador recebe um link "Abrir no Google Maps/Waze" com coordenadas; **sem** API de rotas paga. Sugestão de rota otimizada fica para depois.

---

## 9. Arquitetura dos pagamentos

```ts
interface PaymentProvider {
  readonly id: 'MPESA' | 'EMOLA' | 'CARD' | 'COD' | 'MOCK';
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  getStatus(providerRef: string): Promise<PaymentStatusResult>;
  verifyWebhook(rawBody: string, headers: Headers): VerifiedWebhookEvent;
  refund?(input: RefundInput): Promise<RefundResult>;
}
```

- **Registo de providers** por `id`; o checkout só conhece a interface.
- **Payment** é entidade própria ligada ao `Order` (nunca campos de pagamento dentro de Order). Um `Payment` pode ter várias `PaymentTransaction` (tentativas, reembolsos).
- **Idempotência**: `idempotencyKey` único por tentativa; `WebhookEvent` com `(provider, eventId)` único para descartar duplicados; transições de estado só para frente.
- **Webhook**: endpoint recebe o corpo cru, verifica assinatura, grava o evento e responde 200 rápido; o processamento real corre no worker.
- **Reconciliação**: job que consulta `getStatus` para pagamentos `PENDING` antigos (webhooks perdidos).
- **Pagamento na entrega (COD)**: `Payment` fica `PENDING_COLLECTION`; o entregador regista o recebimento; o admin reconcilia o dinheiro recebido. Requer controlo de caixa por entregador (`DriverCashRemittance`, decisão futura).
- **MOCK provider**: só ativo em `NODE_ENV !== 'production'`, marcado visivelmente na UI ("Pagamento simulado — ambiente de desenvolvimento"). Nunca simula sucesso real em produção.
- Nenhum dado de cartão/PIN toca nos nossos servidores; cartão só via página/tokenização do provider.
- **Integrações reais (M-Pesa, e-Mola)** dependem de contrato/credenciais com os operadores ou de um agregador; não inventamos APIs — os adapters reais só começam quando tivermos a documentação oficial (Fase 12).

---

## 10. Arquitetura das notificações

```
Domínio emite evento ──► NotificationService.notify(event, recipients, data)
                               │ resolve template + preferências + canais
                               ▼
                  Notification (IN_APP, sempre gravada)
                               │ enfileira para cada canal
                               ▼
             Worker ──► ChannelAdapter: Sms | Email | Push | WhatsApp
```

- **Eventos** tipados (`order.created`, `payment.confirmed`, `seller.approved`…) com mapa evento → destinatários → canais → template.
- **IN_APP** sempre; **SMS** para eventos críticos (código de entrega, pedido entregue) dada a realidade de conectividade; **EMAIL** quando houver email; **PUSH** via PWA na fase posterior; **WHATSAPP** exige WhatsApp Business API (custos e aprovação de templates) — começar apenas com link de contacto.
- Retries com backoff, estado por tentativa, deduplicação por `(event, recipient, channel)`.
- Templates em português, centralizados; nada de textos de notificação espalhados no código.
- Fornecedor de SMS em Moçambique por escolher (D9).

---

## 11. Arquitetura do frontend

### 11.1 Renderização
| Página | Estratégia |
|---|---|
| Landing, categorias | Server Component com cache/ISR, revalidação por tag ao alterar dados |
| `/produtos` | Server Component dinâmico (searchParams), queries paginadas |
| `/produtos/[slug]` | ISR + revalidação por tag; schema.org `Product` |
| Carrinho, checkout, áreas autenticadas | Dinâmico, sem cache partilhado |
| Painel | Dinâmico; componentes cliente só para tabelas/gráficos interativos |

### 11.2 Componentes
1. `components/ui` — primitivos shadcn (Button, Input, Dialog, Table…) estilizados com os tokens Agroconet.
2. `components/*` — compostos transversais (PageHeader, EmptyState, ErrorState, DataTable, PriceTag…).
3. `features/<domínio>/components` — componentes específicos (ProductCard, CartLine…).
4. `app/**/page.tsx` — só composição e *data fetching*; sem regra de negócio.

### 11.3 Design
Direção (detalhada na Fase 4): verde floresta profundo como cor de marca, dourado usado com parcimónia (CTA e destaques), neutros quentes; tipografia de alta qualidade (uma serifada para títulos de marca + uma sans legível para UI — a escolher na Fase 4), raios de borda contidos, sombras mínimas, fotografia agrícola real (sem emojis como ícones; Lucide). Estados de loading (skeletons), vazios e erro desenhados desde o início.

### 11.4 Mobile e baixa conectividade
PWA com `manifest` + service worker para *shell* e páginas visitadas; imagens responsivas e formatos modernos; formulários tolerantes a falha (retry, rascunho local do checkout); alvos de toque ≥ 44 px; área do entregador desenhada primeiro para ecrã pequeno.

### 11.5 Acessibilidade e i18n
Contraste AA, foco visível, rótulos corretos. Interface apenas em **pt-MZ** inicialmente, mas com textos centralizados para permitir outros idiomas depois. Moeda `MZN`, formatação via `Intl`.

### 11.6 SEO
`generateMetadata`, Open Graph, `sitemap.ts` dinâmico, `robots.ts` (bloquear `/admin`, `/vendedor`, `/entregador`, `/cliente`, `/checkout`), JSON-LD (`Organization`, `Product`, `BreadcrumbList`), canonical em páginas filtradas.

---

## 12. Estrutura de pastas

```
agroconet/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed/                     # dados de DESENVOLVIMENTO, claramente marcados
├─ public/
├─ docs/                        # ARCHITECTURE, DATABASE, SECURITY, ROADMAP, ADRs
├─ tests/
│  ├─ unit/  ├─ integration/  └─ e2e/
├─ src/
│  ├─ app/
│  │  ├─ (storefront)/          # /, /produtos, /carrinho, /checkout, /cliente
│  │  ├─ (auth)/                # /entrar, /registar, /recuperar
│  │  ├─ (painel)/
│  │  │  ├─ vendedor/
│  │  │  └─ admin/
│  │  ├─ (entregador)/entregador/
│  │  ├─ api/
│  │  │  ├─ webhooks/[provider]/
│  │  │  ├─ uploads/
│  │  │  └─ health/
│  │  ├─ sitemap.ts  robots.ts  manifest.ts
│  │  └─ layout.tsx  error.tsx  not-found.tsx
│  ├─ features/                 # um diretório por domínio
│  │  ├─ catalog/  cart/  checkout/  orders/  inventory/
│  │  ├─ sellers/  drivers/  logistics/  payments/
│  │  ├─ reviews/  notifications/  admin/  auth/
│  │  └─ <feature>/{components,actions,schemas,queries,types}.ts(x)
│  ├─ services/                 # regras de negócio (sem dependência de Next)
│  │  ├─ orders/ inventory/ payments/ logistics/ notifications/ audit/
│  │  └─ payments/providers/{mpesa,emola,card,cod,mock}/
│  ├─ components/{ui,layout,shared}/
│  ├─ lib/                      # db, auth, permissions, money, env, logger, rate-limit, storage
│  ├─ hooks/
│  ├─ validations/              # schemas Zod partilhados
│  ├─ config/                   # site, navegação, constantes, permissões
│  ├─ types/
│  ├─ worker/                   # entrypoint + handlers de jobs
│  └─ middleware.ts
├─ .env.example
├─ docker-compose.yml           # PostgreSQL local
└─ README.md
```

Regra de dependências: `app → features → services → lib`. `services` nunca importam `features` nem `app`.

---

## 13. Ambiente de desenvolvimento e Git/GitHub

Concordo com a abordagem: **tudo local primeiro, produção só no fim**.

- **Local**: Node LTS, PostgreSQL via `docker-compose.yml` (ou instalação local — depende do teu sistema operativo, D10), `npm run dev`, `npm run worker`, `npm run db:migrate`, `npm run db:seed`.
- **Ambientes**: `development` (local) → `staging` (opcional, barato, antes de produção) → `production`. Ficheiros `.env` nunca no Git; só `.env.example`.
- **Git**: repositório privado no GitHub; ramo `main` protegido; ramos curtos `feat/*`, `fix/*`; commits convencionais (`feat:`, `fix:`, `docs:`); PRs mesmo trabalhando sozinho (histórico e CI); um PR/commit final por fase com tag (`phase-1`, `phase-2`…).
- **CI (GitHub Actions)**: `lint` → `typecheck` → `prisma validate` → testes unitários/integração (com serviço Postgres) → `build`. E2E em pipeline separado.
- **Segurança do repositório**: secret scanning e Dependabot ativos; `.gitignore` completo desde o primeiro commit.
- **Migrations**: sempre versionadas e revistas; nunca editar uma migration já aplicada em produção.

---

## 14. Estratégia de deploy na Hostinger

**Não vou assumir o que o plano suporta.** Pontos a verificar antes de contratar/migrar (Fase 16, mas decide-se cedo porque condiciona a arquitetura):

| Requisito da Agroconet | O que verificar |
|---|---|
| Next.js com Node.js em execução contínua (SSR, Server Actions) | Se o plano suporta aplicações Node.js e que versões |
| **PostgreSQL** | Segundo a informação que tenho, a hospedagem partilhada da Hostinger oferece MySQL/MariaDB, não PostgreSQL — **a confirmar no plano**. Em VPS instala-se livremente; alternativa: PostgreSQL gerido externo |
| Worker/processo em segundo plano (pg-boss) | Exige processo persistente: normalmente só VPS |
| Cron / jobs | Disponibilidade e frequência mínima |
| Webhooks de pagamento | URL pública HTTPS estável, sem *timeouts* curtos |
| Uploads | Não guardar no disco da app; usar storage externo |
| SSL e domínio (`.co.mz`/`.com`) | Certificado automático; DNS |
| Memória/CPU | Next.js + worker + Postgres numa mesma máquina pedem margem |
| Backups | Frequência, retenção, restauro testado |
| Latência | Região do datacenter vs utilizadores em Moçambique; usar CDN (ex.: Cloudflare) à frente |

**Recomendação provisória**: **VPS** (Linux) com Node LTS, `pm2` ou Docker, Nginx/Caddy como proxy com SSL, PostgreSQL (na VPS com backups automáticos para storage externo, *ou* gerido externamente), processo web e worker separados. Se o plano escolhido não permitir isto, separamos **apenas o que não cabe** (ex.: PostgreSQL gerido, worker noutro serviço) — a arquitetura já foi desenhada para isso (BD como único ponto de integração entre web e worker).

---

## 15. Riscos técnicos

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | Acesso a M-Pesa/e-Mola exige contrato, credenciais, homologação; prazos fora do nosso controlo | Alto | Lançar com pagamento na entrega + confirmação manual; adapters atrás de interface; começar processo comercial cedo |
| R2 | Hostinger sem PostgreSQL/processos persistentes no plano escolhido | Alto | Decidir plano/infra antes da Fase 16; fallback VPS ou BD externa |
| R3 | Sobrevenda de stock por concorrência | Alto | Reserva com TTL + UPDATE atómico + `CHECK (stock >= 0)` na BD + testes de concorrência |
| R4 | Webhooks duplicados/perdidos | Alto | Idempotência + reconciliação periódica |
| R5 | Endereços informais em Moçambique (sem rua/número) | Médio | Pin no mapa + referência textual + telefone + zonas por bairro |
| R6 | Fraude/abuso (vendedores falsos, produtos proibidos — pesticidas e veterinários são regulados) | Alto | Aprovação de vendedor/produto, documentos, categorias sensíveis com revisão obrigatória; verificar requisitos legais com advogado |
| R7 | COD: dinheiro na mão dos entregadores | Médio | Registo de recebimento, remessa/reconciliação, limites |
| R8 | Conectividade fraca | Médio | PWA, SMS para eventos críticos, payloads pequenos |
| R9 | Multi-vendedor: entrega por vendedor aumenta custo para o cliente | Médio | Mostrar taxa por pacote, opção de hub/consolidação futura |
| R10 | Escopo muito grande para equipa pequena | Alto | Fases + definição de MVP (ver ROADMAP) |
| R11 | Segurança de dados pessoais (clientes, documentos de vendedores/entregadores) | Alto | SECURITY.md; storage privado para documentos; minimização de dados; rever requisitos legais locais |
| R12 | Rate limiting e cache em memória não funcionam com várias instâncias | Baixo/Médio | Começar com 1 instância e limites na BD; migrar para Redis se escalar |

---

## 16. Decisões que precisam da tua confirmação

| ID | Decisão | Recomendação |
|---|---|---|
| D1 | App do cliente: **PWA** agora, React Native depois? | PWA |
| D2 | Autenticação: Better Auth / Auth.js / solução própria mínima (sessões em BD + Argon2) / serviço gerido (Clerk) | **Better Auth** (verificar maturidade/estado na Fase 3). Identificador principal: **telemóvel + OTP por SMS**, email opcional; palavra-passe também permitida |
| D3 | Usar `ProductVariant` desde o início (saco 5 kg / 25 kg)? | Sim |
| D4 | Taxonomia de categorias: usar as do HTML + briefing reconciliadas (lista a validares) | Sim, em árvore |
| D5 | Logística multi-vendedor: entrega por vendedor (MVP) vs hub de consolidação | Entrega por vendedor; hub mais tarde. Envio para outras províncias: fora do MVP, cotação manual |
| D6 | Imagens: Cloudinary vs S3-compatible (ex.: Cloudflare R2) | Cloudinary no MVP (transformações prontas), atrás de `StorageProvider` |
| D7 | Mapas: Google Maps (geocoding, autocomplete) vs Mapbox vs OpenStreetMap | MVP com pin + referência; Google Maps só onde necessário; sem routing pago |
| D8 | Lançamento inicial sem pagamentos online (COD + confirmação manual) enquanto se negoceiam M-Pesa/e-Mola? | Sim |
| D9 | Fornecedor de SMS em Moçambique (agregador local/internacional) | A pesquisar na Fase 13 |
| D10 | Sistema operativo de desenvolvimento e se usas Docker | Preciso para o setup da Fase 1 |
| D11 | Aprovação de produtos: obrigatória para todos, ou só para categorias reguladas (pesticidas, veterinários)? | Configurável; obrigatória por defeito |
| D12 | Moeda e impostos: só MZN; preços com IVA incluído? Emissão de fatura/recibo necessária? | A validar (contabilista) |
| D13 | Plano Hostinger: já contratado? Qual? | Preciso do nome do plano para validar a secção 14 |
| D14 | Um único vendedor inicial (a própria Agroconet) com abertura gradual a terceiros? | Sugerido para reduzir risco de lançamento |
