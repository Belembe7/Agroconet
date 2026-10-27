# Notificações

`NotificationService` fornece criação e listagem de notificações in-app, marcação de leitura limitada ao proprietário e preferências por utilizador/canal/tipo. Os limites e campos livres são validados com Zod.

## Estado de canais

- **IN_APP:** persistência na tabela `notifications`; pronta para ser usada pelos fluxos do produto.
- **SMS/EMAIL/PUSH/WHATSAPP:** dependem de provider, credenciais e worker durável. Não são enviados pelo serviço atual. Não declarar entregues até existir adapter configurado.
- Preferências são guardadas por canal e tipo; `IN_APP` deve permanecer habilitado para mensagens operacionais essenciais.

Ver `docs/PRODUCTION.md` para o bloqueio do SMS/OTP e os critérios de lançamento.
