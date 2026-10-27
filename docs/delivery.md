# Fase 11 — Logística e entregador

## Fluxo implementado

O painel administrativo permite aprovar entregadores existentes, criar zonas e atribuir manualmente uma entrega não atribuída ou falhada a um entregador activo e disponível que esteja associado à zona. A atribuição ocupa o entregador.

A área `/entregador` valida o perfil de utilizador e o estado aprovado, apresenta apenas entregas do próprio perfil, endereços, contacto, ganho estimado, histórico recente e atalho para navegação. O entregador pode aceitar ou recusar uma atribuição; avançar para recolha, recolher e iniciar o percurso ao cliente; concluir com o código de confirmação; ou registar falha com motivo. Transições e propriedade são validadas no servidor. A conclusão cria o ganho pendente e liberta a disponibilidade. A recusa liberta o entregador e devolve a entrega à fila.

A aplicação declara um manifest instalável e usa o shell mobile-first existente. O código de confirmação é guardado como SHA-256; não há serviço SMS ligado, por isso o envio/entrega do código ainda depende de uma operação externa.

## Pendências antes de considerar logística integral

- Upload privado e retenção de fotografia/assinatura; não existe storage configurado nem política de acesso para provas.
- Registo de novos entregadores e recolha/revisão dos documentos com fluxo dedicado.
- Sincronização offline/service worker, push e SMS; não existe canal de notificações pronto nesta fase.
- Painel de histórico e liquidação de ganhos, remessas COD e payouts dependem de reconciliação financeira.
- `AssignmentStrategy` automática e atribuição geográfica requerem critérios operacionais aprovados.
