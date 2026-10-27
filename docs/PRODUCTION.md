# Agroconet — preparação para produção

Este documento reúne o runbook operacional da Fase 16 e os bloqueios que dependem de terceiros. A aplicação ainda não está pronta para receber tráfego ou pagamentos reais até que todos os itens bloqueantes abaixo sejam resolvidos.

## Bloqueios externos

- **Hospedagem e PostgreSQL:** confirmar o plano Hostinger (decisão D13), capacidade de executar Next.js, PostgreSQL 16 e um worker contínuo. A hospedagem não foi provisionada por este repositório.
- **Pagamentos móveis:** fornecer documentação oficial, credenciais de sandbox e produção e regras de callback de M-Pesa/e-Mola. Até então, aceitar apenas COD após confirmação operacional manual; não apresentar MOCK como pagamento real.
- **SMS:** contratar fornecedor e credenciais para OTP e códigos de entrega. O OTP atual é apenas mock de desenvolvimento e não entrega mensagens em produção.
- **Conteúdo legal/comercial:** validar termos, privacidade, devoluções, comissões, taxas de entrega e retenção de dados.
- **Conteúdo de lançamento:** substituir contactos `.local`, produtos `[DEV]` e imagens placeholder por conteúdo autorizado.

## Preparação de ambiente

1. Criar ambientes distintos de staging e produção e uma base PostgreSQL 16 privada, sem porta pública.
2. Definir `DATABASE_URL`, `BETTER_AUTH_SECRET` (aleatório com pelo menos 32 caracteres), `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` no gestor de segredos do host. Não reutilizar credenciais entre ambientes.
3. Configurar domínio, DNS e TLS antes de ativar `NODE_ENV=production`. Habilitar HSTS no proxy TLS e restringir firewall a HTTP/HTTPS e administração por SSH restrita.
4. Configurar backups automáticos cifrados, cópia fora do host principal, retenção definida e procedimento testado de restauração.
5. Configurar logs sem OTP, tokens, dados completos de contacto ou corpos de pagamento; ligar alertas de indisponibilidade, erros 5xx e falhas de worker.
6. Confirmar storage privado para documentos e provas; as credenciais de storage ainda não estão configuradas.
7. Agendar `npm run worker:expire-reservations` a cada minuto para cancelar pedidos COD sem confirmação após 24 horas e devolver as reservas ao catálogo. Monitorar falhas e evitar executar múltiplas cópias concorrentes do mesmo cron.

## Publicação

```bash
npm ci
npm run db:generate
npm run typecheck
npm run lint
npm run build
npm run db:migrate:deploy
npm start
```

Executar migrations com credencial de migração restrita, antes de encaminhar tráfego para a nova versão. Não executar `db:seed` em produção. Verificar `/api/health`, login, catálogo, criação de pedido COD em staging, cancelamento após expiração, cron e alertas antes da promoção.

## Rotina e recuperação

- Monitorar `/api/health` e o processo de worker; drenar tráfego antes de migrações incompatíveis.
- Em incidente de dados, suspender escrita, registar hora e versão, restaurar backup numa base isolada, validar integridade e só então substituir a base ativa.
- Manter a versão anterior e o procedimento de rollback de aplicação disponíveis. Para migrations destrutivas, usar alteração compatível em etapas e só remover colunas numa publicação posterior.
- Documentar responsável, hora, resultado e duração de cada restauração; testar a restauração periodicamente.

## Critério de go-live

Go-live permanece bloqueado até haver hospedagem confirmada, TLS/domínio, backups com restauração comprovada, worker monitorado, SMS funcional, política comercial/legal aprovada, conteúdo final e fluxo de pagamento escolhido e validado. A Fase 12 permanece em COD/manual enquanto os contratos de M-Pesa/e-Mola não forem entregues.
