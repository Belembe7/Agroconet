# Fase 10 — Painel administrativo

O painel `/admin` consulta dados reais da base de dados e exige sessão com papel `ADMIN` ou `SUPER_ADMIN` no layout. Cada serviço verifica ainda as permissões do actor; ações de servidor repetem a autenticação porque podem ser invocadas directamente por POST.

## Disponível

- Indicadores de pedidos, vendedores, produtos, entregas, entregadores e pagamentos marcados como pagos.
- Aprovação e rejeição de vendedores e produtos pendentes, com motivo de rejeição e registo no `AuditLog`.
- Consulta de pedidos recentes, eventos de auditoria, categorias, definições e entregadores.
- Aprovação de perfis de entregador pendentes.
- Criação de zonas com província, áreas e taxa base; despacho manual e reatribuição de entregas falhadas para entregadores activos da zona.
- Criação de categorias e activação/desactivação de categorias existentes.

## Limites actuais

O schema não oferece configuração de comissão global, estado detalhado de pagamento ao cliente, gestão completa de utilizadores/categorias, edição de `SystemSetting`, relatórios exportáveis nem payouts reconciliados. O painel mostra as entidades disponíveis sem inventar regras financeiras. A política automática de atribuição e os gráficos históricos dependem de regras de negócio e dados de séries temporais ainda não definidos.
