# Checkout

O checkout de cliente autenticado está disponível em `/checkout`. O carrinho conserva os artigos para visitantes, mas finalizar exige uma sessão com papel `CUSTOMER`.

## Fluxo implementado

1. O checkout carrega moradas ativas pertencentes ao cliente e os totais do carrinho.
2. O cliente escolhe a morada; o único meio disponível é COD, com confirmação manual.
3. A criação do pedido corre numa transação serializável, volta a verificar disponibilidade, reserva stock por 24 horas, grava snapshots de morada e artigo, divide linhas por vendedor e cria cobrança na entrega. O token do formulário torna reenvios idempotentes.
4. O carrinho é limpo após criar o pedido e o cliente segue para os detalhes do pedido.

Entrega está momentaneamente registada como zero; ainda não há cálculo por zona nem integração de cobrança. O pedido mantém o token idempotente enquanto o formulário for reenviado. Se nenhuma loja confirmar o pedido COD em 24 horas, `npm run worker:expire-reservations` cancela o pedido e liberta as reservas; agendar o comando a cada minuto em infraestrutura com worker/cron. Entregas concluídas consomem a reserva e recusas de vendedores libertam o stock correspondente.
