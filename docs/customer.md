# Área do cliente

O segmento `/cliente` exige sessão válida com papel `CUSTOMER` através do layout protegido existente. O dashboard mostra os cinco pedidos mais recentes e liga para o histórico, detalhes e moradas.

## Funcionalidades

- `/cliente/pedidos`: histórico do cliente autenticado.
- `/cliente/pedidos/[id]`: detalhe isolado por `userId`, com vendedores, artigos, total, pagamento e morada de entrega.
- `/cliente/moradas`: lista as moradas ativas e permite adicionar morada e marcar como principal.
- A criação/consulta de pedidos e moradas filtra sempre pelo utilizador autenticado.

Edição e remoção de moradas, cancelamento/rastreio avançado, notificações e gestão de reembolso ainda dependem dos fluxos de operações e entrega.
