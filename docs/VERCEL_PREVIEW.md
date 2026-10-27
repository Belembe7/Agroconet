# Prévia de cliente na Vercel

Este roteiro publica uma **prévia de avaliação** do estado atual do Agroconet. Não representa lançamento de produção: pagamentos móveis, SMS/OTP real, conteúdo comercial/legal e o worker de reservas continuam pendentes, conforme [`PRODUCTION.md`](./PRODUCTION.md).

## Configuração do projeto

1. Importe `Belembe7/Agroconet` na Vercel e mantenha a raiz do projeto no diretório que contém este `package.json`.
2. Use o preset Next.js e os comandos padrão (`npm install` / `npm run build`). O `postinstall` deste projeto gera o Prisma Client; o projeto também fixa Node.js 22.
3. Crie uma base PostgreSQL separada para a prévia. Não use a base local, nem uma base de produção.
4. Em **Environment Variables**, adicione as variáveis abaixo ao ambiente **Preview**. Não as grave no Git nem em `.env.example`.

| Variável | Valor para Preview |
| --- | --- |
| `DATABASE_URL` | URL TLS da base PostgreSQL de prévia |
| `BETTER_AUTH_SECRET` | Segredo aleatório com pelo menos 32 caracteres, exclusivo deste ambiente |
| `BETTER_AUTH_URL` | URL HTTPS estável atribuída à prévia pela Vercel |
| `NEXT_PUBLIC_APP_URL` | A mesma URL HTTPS estável da prévia |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` | Chave da Maps Embed API, restrita por HTTP referrer ao domínio da prévia; necessária para mostrar o mapa |

`NODE_ENV` é definido pela plataforma. Depois de escolher o domínio estável de Preview, configure nele as duas URLs e faça um novo deploy. Como `NEXT_PUBLIC_APP_URL` é pública, não coloque segredos em variáveis `NEXT_PUBLIC_*`.

A política CSP do projeto autoriza o iframe apenas nos domínios do Google Maps usados pela integração. Restrinja também a chave da API ao domínio Preview no Google Cloud.

## Base de dados de prévia

Antes de abrir o link ao cliente, aplique as migrations à base Preview com `npm run db:migrate:deploy`, usando a credencial dessa base. Não execute `db:seed` numa prévia pública: o seed atual inclui contas de desenvolvimento e uma palavra-passe conhecida. Para apresentar o catálogo, carregue apenas dados fictícios e autorizados, sem contas administrativas com credenciais de desenvolvimento.

Confirme `/api/health`, a página inicial, o catálogo e os detalhes dos produtos. O login só funcionará com a base, o segredo e as URLs corretamente configurados.

## Limites desta prévia

- O worker `worker:expire-reservations` precisa executar a cada minuto; o deploy Next.js não o inicia por si só. Mantenha checkout e operações fora do escopo da demonstração até existir um worker agendado e monitorado.
- Não configure credenciais de pagamentos ou SMS reais para esta prévia.
- Revise os dados de demonstração e torne o link privado ou acessível apenas ao cliente, conforme as opções de proteção de Deployment disponíveis na conta Vercel.

## Atualizações

Após conectar o GitHub, cada push para uma branch gera uma URL Preview. Partilhe com o cliente apenas a URL da versão revisada e mantenha a branch de produção sem promoção até os critérios de [`PRODUCTION.md`](./PRODUCTION.md) serem cumpridos.
