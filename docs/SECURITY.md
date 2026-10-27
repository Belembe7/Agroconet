# Agroconet — Segurança (Fase 0)

> Estratégia e requisitos. A implementação é distribuída pelas fases (autenticação na Fase 3, auditoria completa na Fase 15).
> Não sou advogado: requisitos legais de proteção de dados, comércio eletrónico, fiscalidade e venda de produtos regulados (pesticidas, veterinários) em Moçambique devem ser validados com aconselhamento jurídico.

---

## 1. Princípios

1. **O servidor decide.** O frontend só esconde botões; nunca é barreira de segurança.
2. **Negar por defeito.** Sem permissão explícita, acesso negado.
3. **Menor privilégio** por papel e por recurso.
4. **Defesa em profundidade**: middleware → layout → service (autorização definitiva) → constraints da BD.
5. **Minimização de dados**: não recolher nem guardar o que não se usa; nunca guardar dados de cartão/PIN.
6. **Tudo o que é sensível deixa rasto** (AuditLog).
7. **Falhar de forma segura**: erros não expõem detalhes internos.

---

## 2. Autenticação

| Tema | Decisão |
|---|---|
| Identificador | Telemóvel (E.164) como principal; email opcional |
| Métodos | OTP por SMS e/ou palavra-passe. Palavra-passe: mínimo 8 caracteres, verificação contra listas de passwords comuns; sem regras de composição absurdas |
| Hash | **Argon2id** (parâmetros ajustados ao servidor); nunca SHA/MD5 |
| OTP | 6 dígitos, validade curta (5–10 min), guardado com hash, máx. tentativas, *cooldown* de reenvio, limite por telefone e IP (protege contra abuso e custo de SMS) |
| Sessões | Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, rotação no login, expiração absoluta e por inatividade; sessões revogáveis (BD) |
| Logout | Invalida sessão no servidor |
| Recuperação de password | Token de uso único, curta validade, guardado com hash; resposta idêntica exista ou não a conta (anti-enumeração) |
| Contas privilegiadas | `ADMIN`/`SUPER_ADMIN`: sessões mais curtas; 2FA (TOTP) obrigatório antes de produção (Fase 15) |
| Bloqueio | Limite de tentativas falhadas por conta+IP com atraso progressivo |
| Biblioteca | Decisão D2 (recomendação Better Auth); rever estado/segurança da biblioteca na Fase 3. Não implementar criptografia própria |

---

## 3. Autorização (RBAC + propriedade)

### 3.1 Papéis
`SUPER_ADMIN`, `ADMIN`, `SELLER`, `CUSTOMER`, `DRIVER`. Um utilizador pode acumular papéis; o acesso efetivo é a **união** das permissões, mas cada pedido é avaliado no contexto do recurso.

### 3.2 Matriz de permissões (resumo)

Legenda: ✔ permitido · 🅿 apenas recursos próprios · ✖ negado · ◐ parcial/condicional

| Recurso / Ação | SUPER_ADMIN | ADMIN | SELLER | CUSTOMER | DRIVER |
|---|:-:|:-:|:-:|:-:|:-:|
| Ver catálogo público | ✔ | ✔ | ✔ | ✔ | ✔ |
| Criar/editar produto | ✔ | ✔ | 🅿 | ✖ | ✖ |
| Alterar preço/stock | ✔ | ✔ | 🅿 | ✖ | ✖ |
| Aprovar/rejeitar produto | ✔ | ✔ | ✖ | ✖ | ✖ |
| Aprovar/rejeitar vendedor | ✔ | ✔ | ✖ (nem o próprio) | ✖ | ✖ |
| Gerir categorias | ✔ | ✔ | ✖ | ✖ | ✖ |
| Criar encomenda | ✔ | ✔ | ✖ | ✔ | ✖ |
| Ver encomendas | ✔ todas | ✔ todas | 🅿 só os seus `SellerOrder` | 🅿 as suas | ◐ só entregas atribuídas |
| Mudar estado de `SellerOrder` | ✔ | ✔ | 🅿 (transições permitidas) | ✖ | ◐ (recolha/entrega via Delivery) |
| Atribuir entregador | ✔ | ✔ | ✖ | ✖ | ✖ |
| Atualizar estado de entrega | ✔ | ✔ | ✖ | ✖ | 🅿 |
| Ver dados de contacto do cliente | ✔ | ✔ | ◐ só nome/zona para preparar o pedido | 🅿 | ◐ só o necessário e enquanto a entrega está ativa |
| Ver pagamentos | ✔ | ✔ | ◐ só o resumo dos seus | 🅿 | ✖ (exceto COD a cobrar) |
| Ver/alterar comissões | ✔ | ◐ ver; alterar só SUPER_ADMIN | ◐ ver as suas | ✖ | ✖ |
| Registar payout | ✔ | ✔ | ✖ | ✖ | ✖ |
| Gerir utilizadores/papéis | ✔ | ◐ não promove a admin | ✖ | ✖ | ✖ |
| Gerir entregadores | ✔ | ✔ | ✖ | ✖ | ✖ |
| Configurações do sistema | ✔ | ◐ parte | ✖ | ✖ | ✖ |
| Ver AuditLog | ✔ | ◐ leitura | ✖ | ✖ | ✖ |
| Avaliar | ✔ | — | ✖ | 🅿 só itens que recebeu | ✖ |

### 3.3 Como se aplica (obrigatório)

- `lib/permissions.ts`: mapa `papel → permissões` tipado, e funções `can(actor, permission)` e `assertCan(...)`.
- Cada **service** recebe um `actor` (`{ userId, roles, sellerId?, driverId? }`) e chama `assertCan` **e** verifica propriedade. Exemplo: `updateProduct(actor, productId, input)` carrega o produto **com filtro por `seller_id`** do actor (um produto de outro vendedor é tratado como inexistente: `404`, não `403`, para não revelar existência).
- **Consultas sempre filtradas pelo dono** (`where: { sellerId: actor.sellerId }`), nunca "buscar e depois verificar" quando evitável.
- Proibido: aceitar `sellerId`, `userId`, `role`, `price`, `status`, `commission` vindos do cliente. O servidor deriva-os da sessão ou do recurso.
- Testes de autorização obrigatórios por service sensível (matriz de "atacantes": seller A contra recurso do seller B, customer contra admin, driver contra encomenda alheia).
- Mudança de papéis gera AuditLog e invalida sessões.

---

## 4. Validação e proteção de inputs

- **Zod em todas as fronteiras**: Server Actions, Route Handlers, `searchParams`, webhooks, variáveis de ambiente (`env.ts` falha no arranque se faltar algo).
- Listas brancas (`select`) em vez de passar objetos inteiros do cliente para o Prisma (evita *mass assignment*).
- **SQL injection**: apenas Prisma com parâmetros; SQL cru só com `Prisma.sql`/parâmetros, nunca concatenação.
- **XSS**: React escapa por defeito; proibido `dangerouslySetInnerHTML` com conteúdo de utilizadores; descrições de produtos em texto simples ou Markdown limitado com sanitização (allow-list).
- **CSRF**: Server Actions têm verificação de origem do Next.js; `SameSite=Lax`; Route Handlers mutáveis exigem verificação de `Origin` ou token; webhooks usam assinatura, não cookies.
- **Open redirect**: parâmetros `next/returnTo` validados contra allow-list de caminhos internos.
- **Enumeração**: mensagens genéricas em login/recuperação/registo.

## 5. Rate limiting

| Alvo | Limite (ponto de partida) |
|---|---|
| Login / OTP / recuperação | Por IP **e** por identificador; agressivo |
| Criação de conta | Por IP |
| Pesquisa e listagens públicas | Moderado por IP |
| Checkout / criação de pedido | Por utilizador |
| Webhooks | Por origem; validação de assinatura primeiro |
| Uploads | Por utilizador |

Implementação: começa em PostgreSQL (tabela de contadores) ou em memória numa única instância; migrar para Redis/serviço gerido se houver várias instâncias (R12). Respostas `429` com `Retry-After`. Cloudflare (ou equivalente) à frente para mitigar abuso básico.

## 6. Headers e transporte

- HTTPS obrigatório (HSTS), redirecionar HTTP→HTTPS.
- `Content-Security-Policy` restritiva (nonce); `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` (câmara só na área do entregador); `X-Frame-Options`/`frame-ancestors 'none'`.
- Cookies `Secure` e com prefixo `__Host-` quando aplicável.
- CORS fechado por defeito; abrir apenas para origens conhecidas quando existir API móvel.

## 7. Uploads e ficheiros

- **Upload direto ao storage** por URL pré-assinado emitido pelo servidor após autorização; limite de tamanho e de tipo declarado no URL.
- Validação no servidor do **tipo real** (magic bytes), não só da extensão; allow-list: `image/jpeg`, `image/png`, `image/webp`; documentos: `application/pdf` + imagens.
- Limites: imagens de produto (ex.: 5 MB, máx. N por produto), documentos (ex.: 10 MB).
- Nomes de ficheiro gerados pelo servidor (UUID); nunca usar o nome original no caminho.
- **Documentos de vendedores/entregadores e provas de entrega em storage privado** (acesso por URL assinado de curta duração, só para papéis autorizados). Imagens de produto podem ser públicas.
- Remoção de metadados EXIF (inclui GPS) em imagens públicas.
- Antivírus/scan: avaliar na Fase 15 se houver uploads de PDFs de terceiros em volume.

## 8. Dados pessoais e privacidade

- Inventário de dados pessoais: nome, telefone, email, endereços, coordenadas, documentos de identificação/negócio (vendedores/entregadores), fotos/assinaturas de entrega.
- **Minimização entre papéis**: o vendedor não recebe o telefone/endereço completos do cliente (o entregador recebe o necessário, só durante a entrega ativa). Decisão a validar (D15): expor contacto do cliente ao vendedor para esclarecimentos? Por defeito, não.
- Encriptação em repouso ao nível do fornecedor (disco/BD); campos especialmente sensíveis (ex.: número de documento do vendedor) com encriptação ao nível da aplicação, se se justificar.
- Política de retenção e direito de apagar/anonimizar contas (respeitando obrigações fiscais/contabilísticas): soft delete + anonimização.
- **Logs sem PII**: nunca registar passwords, OTPs, tokens, números completos de telefone, corpos de pagamentos.
- Termos de uso e Política de privacidade redigidos/validados juridicamente antes do lançamento.

## 9. Pagamentos

- Nenhum dado de cartão, PIN ou credenciais de carteira móvel passa pelos nossos servidores ou logs.
- Valor e moeda **sempre recalculados no servidor**; o cliente nunca indica o preço.
- Webhooks: verificação de assinatura, corpo cru, *replay protection* (timestamp/eventId), idempotência (`UNIQUE(provider, event_id)`), resposta rápida e processamento assíncrono.
- Estados de pagamento só avançam (máquina de estados); `PAID` não é definido por redirecionamento do cliente, apenas por confirmação do provider/webhook/consulta.
- Reconciliação periódica; alertas para divergências.
- Reembolsos e payouts: só admin, dupla confirmação para valores acima de um limite, AuditLog.
- **MOCK provider desativado em produção** por verificação de arranque (`env` + teste).
- COD: limites por entregador e reconciliação diária.

## 10. Segredos e configuração

- Segredos apenas em variáveis de ambiente do servidor; `NEXT_PUBLIC_*` só para valores realmente públicos.
- `.env` no `.gitignore`; `.env.example` sem valores reais; *secret scanning* e *pre-commit hook* (ex.: gitleaks).
- Segredos distintos por ambiente; rotação quando houver suspeita de fuga.
- Chaves de provedores (pagamentos, SMS, storage) com o mínimo de permissões.
- Acesso ao servidor por chave SSH, sem login root por password; firewall a expor só 80/443 (+SSH restrito).

## 11. Auditoria e monitorização

**AuditLog** regista: login (sucesso/falha), logout, criação/alteração/remoção de entidades críticas, aprovações/rejeições, alteração de preço, alteração de stock, mudanças de estado de encomenda/entrega, operações financeiras (pagamentos, reembolsos, payouts, comissões), alterações de papéis/configurações. Campos: quem, papel, ação, entidade, ID, antes/depois (campos relevantes), IP, *user agent*, `request_id`, data.

- Imutável (apenas INSERT; permissões de BD a impedir UPDATE/DELETE para o utilizador da aplicação).
- Registo feito dentro da mesma transação da operação quando possível.
- **Logging estruturado** com `request_id`; erros para um serviço de monitorização (ex.: Sentry) sem PII; alertas para: picos de falhas de login, webhooks inválidos, erros de pagamento, stock negativo tentado, falhas de notificação.

## 12. Base de dados e infraestrutura

- Utilizadores de BD com privilégios mínimos (aplicação ≠ migrações ≠ leitura de relatórios).
- Constraints `CHECK`, FKs, `UNIQUE` como última linha de defesa (stock ≥ 0, unicidade de idempotência).
- Transações em operações multi-tabela (checkout, stock, pagamentos).
- **Backups** automáticos diários + retenção definida + **teste de restauro periódico**; cópia fora do servidor principal.
- Atualizações do SO e de dependências (Dependabot, `npm audit` em CI); imagem/ambiente reproduzível.
- Separação de ambientes; nunca usar dados reais em desenvolvimento.

## 13. Segurança do código e da cadeia de fornecimento

- TypeScript `strict`; ESLint com regras de segurança; revisão por PR.
- Poucas dependências, versões fixadas com *lockfile*; revisão antes de adicionar bibliotecas.
- CI bloqueia merge com falhas de lint/tipos/testes.
- Testes de segurança automatizados: matriz de autorização, rate limiting, validação de inputs, idempotência de pagamentos, concorrência de stock.

## 14. Modelo de ameaças — principais cenários

| Ameaça | Controlo principal |
|---|---|
| Vendedor altera produto/vendas de outro (IDOR) | Filtro por `seller_id` em cada query + testes de autorização |
| Vendedor aprova o próprio registo / produto | `assertCan` + regra `reviewer != owner` |
| Cliente manipula preço/stock/total no pedido | Preços recalculados no servidor; snapshots |
| Sobrevenda por concorrência | UPDATE atómico + `CHECK` + reservas |
| Pagamento duplicado / webhook reenviado | Idempotência + `UNIQUE` |
| Falsa confirmação de pagamento | Só via webhook verificado/consulta ao provider |
| Enumeração/força bruta de contas e OTP | Rate limit + mensagens genéricas + bloqueio |
| Abuso de SMS (custo) | Limites por IP/telefone, CAPTCHA se necessário |
| Entregador vê/edita entregas alheias | Filtro por `driver_id` + estados permitidos |
| Fuga de documentos de identidade | Storage privado, URLs assinados, acesso auditado |
| Upload malicioso | Validação de tipo real, limites, nomes gerados |
| Conta de admin comprometida | 2FA, sessões curtas, AuditLog, alertas |
| Fuga de segredos no Git | `.gitignore`, secret scanning, rotação |

## 15. Checklist de segurança por fase

| Fase | Itens |
|---|---|
| 1 | `.gitignore`, `.env.example`, validação de env, headers base, CI |
| 2 | Constraints/índices, utilizador de BD com privilégios mínimos, seed só em dev |
| 3 | Hash Argon2id, sessões, OTP com limites, RBAC, middleware, testes de autorização |
| 4–6 | Sem `dangerouslySetInnerHTML`, sanitização, paginação com limites máximos |
| 7 | Checkout transacional, preços no servidor, idempotência, reservas de stock |
| 9–10 | Autorização por recurso, AuditLog nas ações críticas, uploads seguros |
| 11 | Validação do código de entrega com limite de tentativas, storage privado para provas |
| 12 | Webhooks assinados, reconciliação, MOCK off em produção |
| 13 | Preferências, limites de envio, sem PII em logs |
| 14–15 | Testes de segurança, revisão de permissões e queries, 2FA admin, revisão de headers/CSP |
| 16 | Backups testados, SSL/HSTS, firewall, monitorização e alertas, rotação de segredos |
