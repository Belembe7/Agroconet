# Agroconet

Marketplace multi-vendedor de insumos agropecuários com logística própria (Maputo e Matola).

Documentação da Fase 0: [`docs/`](./docs/).

## Pré-requisitos

- Node.js 22 LTS
- PostgreSQL 16 (recomendado via Docker Desktop)
- npm 10+

## Arranque rápido

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env

# 3. Base de dados local (requer Docker)
npm run db:up

# 4. Cliente Prisma
npm run db:generate

# 5. App
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).
Health: [http://localhost:3000/api/health](http://localhost:3000/api/health).

> **Sem Docker:** instala PostgreSQL localmente e ajusta `DATABASE_URL` no `.env` para o mesmo formato do `.env.example`.

## Scripts

| Comando                              | Descrição                                                |
| ------------------------------------ | -------------------------------------------------------- |
| `npm run dev`                        | Servidor de desenvolvimento                              |
| `npm run build`                      | Build de produção                                        |
| `npm run lint`                       | ESLint                                                   |
| `npm run typecheck`                  | TypeScript sem emitir ficheiros                          |
| `npm run format`                     | Prettier                                                 |
| `npm run db:up`                      | Sobe PostgreSQL (Docker Compose)                         |
| `npm run db:generate`                | Gera o Prisma Client                                     |
| `npm run db:migrate`                 | Migrations (dev)                                         |
| `npm run db:migrate:deploy`          | Migrations (deploy)                                      |
| `npm run db:seed`                    | Seed de desenvolvimento                                  |
| `npm run worker:expire-reservations` | Cancela pedidos não confirmados e liberta stock expirado |
| `npm run test`                       | Testes (Vitest)                                          |
| `npm run test:integration`           | Testes de integração                                     |

## Estrutura (resumo)

```
src/
  app/           # App Router (storefront, auth, painel, entregador, api)
  features/      # Domínios (UI + actions)
  services/      # Regras de negócio (sem dependência de Next)
  lib/           # db, env, utils
  config/        # Constantes do site
prisma/          # Schema e migrations
docs/            # Arquitetura, BD, segurança, roadmap
```

## Roadmap

| Fase  | Estado                   | Conteúdo                                                                                                           |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 0     | Feita                    | Arquitetura, BD, segurança, roadmap                                                                                |
| 1     | Feita                    | Setup Next.js, Prisma, Docker, CI, health                                                                          |
| 2     | Feita                    | Schema, seed, InventoryService, testes                                                                             |
| 3     | Feita                    | Auth Better Auth, RBAC, OTP mock, áreas                                                                            |
| 4     | Feita                    | Design system, tokens, componentes UI                                                                              |
| 5–11  | Implementadas localmente | Landing, marketplace, checkout COD e áreas de operação; validação de performance e funcional pendente              |
| 12–16 | Parcial / bloqueadas     | Pagamentos reais, canais externos, testes de aceitação e infraestrutura de produção dependem de trabalho adicional |

Ver [`docs/ROADMAP.md`](./docs/ROADMAP.md) para o estado atual das fases e respetivos bloqueios.

O estado detalhado e as dependências para lançamento estão em [`docs/PRODUCTION.md`](./docs/PRODUCTION.md). Agendar `npm run worker:expire-reservations` a cada minuto para libertar reservas vencidas; o comando é necessário em staging e produção.

Para preparar uma prévia privada do estado atual na Vercel, consulte [`docs/VERCEL_PREVIEW.md`](./docs/VERCEL_PREVIEW.md). A prévia não equivale a produção nem ativa pagamentos reais.

### Contas de desenvolvimento (após `npm run db:seed`)

Palavra-passe: `AgroconetDev1!`

| Papel       | Telemóvel     | Área          |
| ----------- | ------------- | ------------- |
| SUPER_ADMIN | +258840000001 | `/admin`      |
| ADMIN       | +258840000002 | `/admin`      |
| SELLER      | +258840000011 | `/vendedor`   |
| DRIVER      | +258840000021 | `/entregador` |
| CUSTOMER    | +258840000031 | `/cliente`    |

OTP em desenvolvimento: aparece no terminal do `npm run dev` como `[DEV OTP]`.

## Licença

Projeto privado.
