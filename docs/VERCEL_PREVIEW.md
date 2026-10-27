# Prévia de cliente na Vercel

Este roteiro publica uma **prévia de avaliação** do estado atual do Agroconet. Não representa lançamento de produção: pagamentos móveis, SMS/OTP real, conteúdo comercial/legal e o worker de reservas continuam pendentes, conforme [`PRODUCTION.md`](./PRODUCTION.md).

## Configuração do projeto

1. Importe `Belembe7/Agroconet` na Vercel e mantenha a raiz do projeto no diretório que contém este `package.json`.
2. Use o preset Next.js e os comandos padrão (`npm install` / `npm run build`). O `postinstall` deste projeto gera o Prisma Client; o projeto também fixa Node.js 22.
3. Crie uma base PostgreSQL separada para a prévia. Não use a base local, nem uma base de produção.
4. Em **Environment Variables**, adicione as variáveis abaixo ao ambiente do deploy. A primeira importação pode ser classificada pela Vercel como **Production**, mesmo sendo uma demonstração; nesse caso, configure **Production**. Configure **Preview** também se publicar outras branches, usando uma base separada. Não grave segredos no Git nem em `.env.example`.
5. Mantenha **Enable access to System Environment Variables** ativo e o preset **Next.js** selecionado. O sistema usa as variáveis públicas da Vercel para obter o endereço do deploy automaticamente.

| Variável | Valor para Preview |
| --- | --- |
| `DATABASE_URL` | URL TLS da base PostgreSQL de prévia |
| `BETTER_AUTH_SECRET` | Segredo aleatório com pelo menos 32 caracteres, exclusivo deste ambiente |
| `BETTER_AUTH_URL` | Opcional na Vercel; substitui o endereço de autenticação calculado automaticamente |
| `NEXT_PUBLIC_APP_URL` | Opcional na Vercel; substitui o endereço público calculado automaticamente, por exemplo para um domínio próprio |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` | Chave da Maps Embed API, restrita por HTTP referrer ao domínio da prévia; necessária para mostrar o mapa |

`NODE_ENV` é definido pela plataforma. Em Production, o endereço automático é `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` (ou o domínio do deploy, se necessário). Em Preview, o sistema usa `NEXT_PUBLIC_VERCEL_URL`, sem apontar a autenticação para produção. As origens de autenticação adicionais são apenas os domínios exatos fornecidos pela Vercel para esse deploy e a sua branch. No desenvolvimento local, continue a definir as URLs de `localhost` no `.env`.

Como `NEXT_PUBLIC_APP_URL` é pública, não coloque segredos em variáveis `NEXT_PUBLIC_*`. As duas variáveis obrigatórias para o servidor são `DATABASE_URL` e `BETTER_AUTH_SECRET`; uma URL PostgreSQL local não funciona na Vercel.

Se o build indicar `Invalid environment variables`, verifique em **Settings → Environment Variables** se as variáveis obrigatórias existem no ambiente do deploy que falhou. Guarde as alterações e publique um novo deploy com o commit mais recente. Não use `SKIP_ENV_VALIDATION` para esconder a falta de configuração.

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
