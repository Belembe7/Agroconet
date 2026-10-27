# Agroconet — Roadmap (Fase 0)

> Regra de trabalho: em cada fase → objetivo → o que será criado → implementar → testar → corrigir → verificar integração → documentar → **aguardar "AVANÇAR"**.
> Tamanho relativo: **S** (curto) · **M** · **L** · **XL**. Não são datas: dependem do ritmo de validação entre fases.

---

## Visão por marcos

| Marco | Fases | Resultado |
|---|---|---|
| **M1 — Fundação** | 0, 1, 2, 3, 4 | Projeto a correr localmente, BD modelada e semeada, autenticação com RBAC, design system |
| **M2 — Loja** | 5, 6, 7 | Landing, catálogo, carrinho e checkout com pedido criado (pagamento simulado/COD) |
| **M3 — Operação** | 8, 9, 10, 11 | Áreas do cliente, vendedor, admin e entregador: a operação completa funciona ponta-a-ponta |
| **M4 — Produção** | 12, 13, 14, 15, 16 | Pagamentos reais, notificações, testes, auditoria de segurança/performance, lançamento |

## Estado de execução em 2026-10-27

- **Fases 7–11 implementadas localmente:** checkout COD idempotente com cancelamento por expiração; área de cliente; área de vendedor; painel admin; e operação de entregas. `npm run lint`, `npm run typecheck` e `npm run build` passaram nesta execução. Os fluxos ainda carecem de validação funcional e de testes automatizados antes de considerar os critérios de saída completos.
- **Fase 12 bloqueada por integração externa:** checkout está limitado a COD. Adapters M-Pesa/e-Mola/cartão exigem documentação oficial e credenciais de sandbox/produção; não foram simulados.
- **Fase 13 parcial:** serviço e preferências de notificações in-app estão disponíveis. SMS, email e worker de notificações aguardam fornecedor, credenciais e infraestrutura.
- **Fase 14 pendente:** não foram criados nem executados testes nesta execução. A validação automatizada de checkout, estados, permissões e ponta-a-ponta continua necessária.
- **Fase 15 parcial:** OTP em produção falha explicitamente sem SMS configurado e há autorização por propriedade nos serviços principais. 2FA admin, auditoria independente de segurança/performance, endurecimento final de CSP e revisão de uploads permanecem pendentes.
- **Fase 16 preparada, não lançada:** existe runbook em `docs/PRODUCTION.md`, mas hospedagem, domínio/TLS, storage, monitorização, backups e restauração não foram provisionados ou comprovados. Go-live permanece bloqueado até fechar os itens desse documento.

### O que é o MVP (proposta)
Primeira venda real possível ao fim do **M3**, com **pagamento na entrega + confirmação manual** e atribuição manual de entregadores, enquanto se tratam contratos de M-Pesa/e-Mola em paralelo (R1, D8). Isto evita que a integração dos operadores bloqueie o lançamento.

### Ajustes sugeridos à ordem original (para decisão tua)
1. **Dividir a Fase 10**: entregar um **Admin mínimo** (aprovar vendedores/produtos, ver encomendas, gerir categorias) logo após a Fase 7 ou em paralelo com a 9, porque sem aprovação não há catálogo real. O restante do admin (relatórios, gráficos, configurações) fica na Fase 10.
2. **Notificações base (in-app + SMS do código de entrega)** podem precisar de adiantar-se para a Fase 11, pois a entrega depende do código. A estrutura central (`NotificationService`) mantém-se na Fase 13, mas criamos o esqueleto e os eventos essenciais antes.
3. **Cliente (Fase 8)** é curta; pode fundir-se com a Fase 7 se preferires menos pontos de validação.

---

## FASE 0 — Arquitetura ✅ (este pacote)
**Entrega**: `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, `ROADMAP.md`.
**Saída**: decisões D1–D15 confirmadas.

## FASE 1 — Setup · S ✅
**Cria**: projeto Next.js + TypeScript estrito, Tailwind, shadcn/ui, Prisma ligado ao PostgreSQL local (Docker Compose), ESLint/Prettier/Husky, validação de env (`env.ts`), estrutura de pastas, `README`, CI no GitHub Actions, repositório Git com `.gitignore` e `.env.example`, headers de segurança base, `/api/health`.
**Critério de saída**: `npm install` e `npm run dev` funcionam num clone limpo; CI verde; BD local sobe com um comando.
**Verificado (2026-10-19)**: Docker Desktop OK; Postgres healthy; `/api/health` → `database: ok`.

## FASE 2 — Base de dados · L ✅
**Cria**: `schema.prisma` completo, migrations (incl. constraints `CHECK`, índices GIN/trigram, colunas geradas), seed de desenvolvimento, `InventoryService` base, testes das relações e da atomicidade do stock.
**Critério de saída**: migrations aplicam-se do zero; seed cria o cenário; teste de concorrência de stock passa; schema revisto contra DATABASE.md.
**Verificado (2026-10-19)**: `db:migrate:deploy` OK; seed (`tsx prisma/seed/index.ts` via `prisma.config.ts`) OK; `tests/integration/inventory-concurrency.test.ts` 2/2.

## FASE 3 — Autenticação e RBAC · L ✅
**Cria**: registo (telemóvel+OTP/password), login, logout, recuperação, sessões, papéis, `permissions.ts`, middleware, guardas de layout, `AuditService` (login/logout/mudanças de papel), rate limiting base.
**Critério de saída**: matriz de autorização testada (cada papel vs cada área); tentativas de acesso cruzado falham no servidor.
**Depende de**: D2; fornecedor de SMS (ou *mock* de OTP em dev).
**Verificado (2026-10-20)**: Better Auth + OTP mock; `/entrar` `/registar` `/recuperar`; guardas `/admin` `/vendedor` `/entregador` `/cliente`; `RoleService`; rate limit Better Auth + `lib/rate-limit`; testes unitários de matriz RBAC/áreas.

## Pendente Fase 3 (adiado, não bloqueia saída)
- SMS real (Fase 13); 2FA admin (Fase 15); `OtpChallenge` legado vs `verifications` do Better Auth (limpeza futura).

## FASE 4 — Design system · M ✅ (direcção visual 02 aprovada)
**Cria**: tokens (cores, tipografia, espaçamento, raios, sombras), componentes base (botões, inputs, cards, badges, dialogs, tabelas, dropdowns, toasts, skeletons, empty/error states), layouts dos três grupos de rotas, página de referência (*style guide*) interna.
**Critério de saída**: contraste AA, responsivo em 360 px a desktop, modo de foco acessível; aprovação visual da identidade.
**Depende de**: escolha de tipografia, recolha de fotografia agrícola de qualidade (licenciada/própria).
**Implementação (2026-10-22)**: tokens, Lora/DM Sans, primitivos base-nova, compostos partilhados, layouts e guia interno `/design-system`. Build, lint, tipos e 43 testes unitários passaram. Guia verificado em desktop/360 px; revisão dos shells autenticados depende da BD local. Aprovação visual pendente; ver `DESIGN_SYSTEM.md`.

## FASE 5 — Landing page · M (implementada; performance móvel e revisão pendentes)
**Cria**: header/hero com pesquisa, categorias, produtos em destaque (da BD), como funciona, para vendedores, logística, confiança, footer; SEO base; contactos vindos de `SystemSetting`.
**Critério de saída**: Lighthouse móvel elevado (performance/acessibilidade/SEO), sem dados hardcoded.
**Implementado (2026-10-22)**: página inicial com identidade aprovada, pesquisa/filtros na landing, categorias/destaques/contactos/zonas da BD, secções informativas, metadata e ícone. 51 testes passaram (incluindo integração). Lighthouse móvel: performance 76; acessibilidade, boas práticas e SEO 100. A meta de performance elevada ainda está pendente. Ver `LANDING.md` e relatório Lighthouse. Fotografias reais de produtos e contactos de produção ainda precisam de conteúdo.

## FASE 6 — Marketplace · XL ✅ (implementada localmente em 2026-10-22)
**Entrega**: `/produtos` com pesquisa, filtros, ordenação e paginação na URL; páginas de produto com variantes, disponibilidade, vendedor, relacionados e JSON-LD; favoritos; carrinho de visitante e cliente com fusão no login; sitemap e robots. Ver `MARKETPLACE.md`.
**Validação**: build, typecheck, lint e 56 testes passaram (incl. pesquisa/filtros, vendedores suspensos, carrinho multi-vendedor e stock na fusão); migration e índices aplicados localmente; mobile 360 px corrigido. `EXPLAIN` foi executado com o seed de desenvolvimento (~40 produtos): o planner escolheu scan sequencial da tabela pequena e usou `sellers_status_idx`; critério de performance com volume representativo continua pendente. Repetir antes do lançamento. A suíte reporta um aviso de depreciação do cliente `pg` durante testes concorrentes, sem falhas.
**Limite**: reserva/baixa de stock só acontece no checkout da Fase 7; cada mutação revalida stock. As imagens do seed são placeholders.

## FASE 7 — Checkout · XL
**Cria**: checkout em 6 etapas, endereços, opções de entrega por zona, criação transacional de `Order`/`SellerOrder`/`OrderItem`, reservas de stock e expiração, `PaymentProvider` + MOCK + COD, idempotência, confirmação, máquinas de estado.
**Critério de saída**: testes de integração do checkout (sucesso, falta de stock, pagamento falhado, duplo clique, expiração de reserva).

## FASE 8 — Área do cliente · M
**Cria**: dashboard, pedidos e detalhe (com estado por pacote), favoritos, endereços, perfil, notificações in-app, avaliações após entrega.

## FASE 9 — Área do vendedor · L
**Cria**: candidatura e fluxo de aprovação (lado vendedor), dashboard, catálogo (CRUD, variantes, imagens), stock e movimentos, pedidos recebidos com transições, vendas, comissões, perfil. Uploads seguros.
**Critério de saída**: testes de autorização (seller A vs seller B) e de aprovação de produto.

## FASE 10 — Painel administrativo · XL
**Cria**: dashboard com indicadores e gráficos, aprovação/rejeição de vendedores e produtos, gestão de categorias/utilizadores/encomendas/pagamentos/comissões/payouts, relatórios, configurações do sistema, consulta de AuditLog.
**Nota**: a parte mínima pode ser adiantada (ver ajustes sugeridos).

## FASE 11 — Logística · XL
**Cria**: zonas, registo e aprovação de entregadores, atribuição manual (e `AssignmentStrategy` preparada para automática), app do entregador (PWA mobile-first), fluxo de estados, confirmação por código/foto/assinatura, histórico e ganhos, `DriverEarning`, links de navegação.
**Critério de saída**: entrega simulada do início ao fim, incluindo recusa, falha de entrega e reatribuição.

## FASE 12 — Pagamentos reais · L (depende de terceiros)
**Cria**: adapters M-Pesa / e-Mola / cartão conforme **documentação oficial e credenciais** fornecidas; webhooks assinados; reconciliação; reembolsos; controlo de caixa COD; payouts a vendedores/entregadores.
**Regra**: sem credenciais/documentação, permanece o MOCK e COD. Não se inventam APIs.

## FASE 13 — Notificações · M
**Cria**: `NotificationService` completo, templates pt, preferências, canais IN_APP/SMS/EMAIL (PUSH e WhatsApp quando viável), retries e deduplicação, todos os eventos do briefing.

## FASE 14 — Testes · L
**Cria**: lacunas de testes unitários (cálculos, stock, comissões, estados, validações), integração (checkout, pedidos, auth, pagamentos), **E2E Playwright** (cadastro, login, compra, vendedor, entrega), metas de cobertura nas áreas críticas.

## FASE 15 — Segurança e performance · M/L
**Cria**: auditoria de permissões, revisão de endpoints e queries, carga básica, 2FA para admins, CSP endurecida, revisão de uploads, rate limits finais, revisão de logs, dependências e segredos; correções.

## FASE 16 — Produção · M
**Cria**: build de produção, variáveis de ambiente, PostgreSQL de produção, domínio e SSL, storage, worker em execução contínua, backups com teste de restauro, monitorização/alertas, logs, plano de rollback e *runbook*, *go-live checklist*.
**Depende de**: plano/infra Hostinger confirmado (D13), contratos de pagamento/SMS, termos e privacidade aprovados.

---

## Dependências externas a iniciar cedo (não bloqueiam o código, mas têm prazos próprios)

| Item | Quando começar | Porquê |
|---|---|---|
| Contrato/credenciais M-Pesa e e-Mola (ou agregador) | Já, em paralelo | Podem demorar semanas |
| Fornecedor de SMS | Antes da Fase 3/11 | OTP e código de entrega |
| Plano Hostinger/infra definitiva | Antes da Fase 7 (worker/BD condicionam o desenho) | Risco R2 |
| Domínio | Antes da Fase 16 (idealmente já para branding/email) | |
| Fotografia e logótipo em alta qualidade | Antes da Fase 4/5 | Qualidade "premium" depende disto |
| Termos de uso, privacidade, política de devoluções | Antes da Fase 16 | Validar com advogado |
| Regras para categorias reguladas (pesticidas, veterinários) | Antes da Fase 9 | Afeta aprovação de produtos |
| Política comercial: comissões, taxas de entrega, pagamento a entregadores | Antes das Fases 7 e 11 | Entram como configuração |

## Definição de "feito" (por fase)
1. Funcionalidade implementada e demonstrável.
2. Testes relevantes passam (local e CI).
3. Sem erros de lint/tipos; sem segredos no código.
4. Mobile verificado (onde aplicável).
5. Autorização testada no servidor (onde aplicável).
6. Documentação atualizada (README/docs/ADR).
7. Resumo do que foi feito e do que ficou pendente.
