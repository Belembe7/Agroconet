# Agroconet — Marketplace (Fase 6)

## Experiência pública

- `/produtos`: pesquisa em português, categoria, intervalo de preço, stock, ordenação e paginação; todos os filtros ficam na query string para partilhar e voltar ao mesmo resultado.
- `/produtos/[slug]`: produto público com variantes activas, preço mínimo, disponibilidade, vendedor aprovado, avaliações, imagens disponíveis e produtos relacionados. Slugs antigos redireccionam para o slug canónico.
- `/favoritos`: área de cliente autenticado; estado do favorito no cartão e detalhe usa serviço no servidor.
- `/carrinho`: carrinho de visitante ou cliente. Linhas agrupam-se por vendedor para manter o futuro checkout multi-vendedor.
- `/sitemap.xml`, `/robots.txt` e JSON-LD Product completam a exposição SEO das páginas públicas.

## Pesquisa e acesso público

`CatalogService` normaliza parâmetros antes da consulta e usa PostgreSQL FTS (`search_vector`/`websearch_to_tsquery`) com fallback textual escapado, categoria, disponibilidade e preço. Faz uma consulta paginada e hidrata os cartões numa consulta em lote, evitando N+1. Apenas categorias activas e produtos publicados, não apagados, com vendedor aprovado/activo e variantes activas entram nas páginas e sitemap. Imagens sem URL pública resolvida são descartadas e o UI apresenta placeholder.

`CatalogData` aplica Cache Components aos dados públicos, com tags e vida útil de um minuto para resultados e uma hora para sitemap. A página de detalhe contém canonical, Open Graph e schema Product/Offer. `robots.ts` impede indexação de rotas privadas e parâmetros de filtros.

## Carrinho e favoritos

O carrinho convidado usa um token aleatório num cookie HttpOnly, Secure em produção e SameSite=Lax; só o SHA-256 do token é persistido. Após autenticação ou registo, linhas convidadas são combinadas com o carrinho do cliente por variante, mantendo sellerId e limitando a quantidade ao stock actual. As alterações são revalidadas na transacção e quantidade máxima por linha é 99. Favoritos exigem sessão Customer e não revelam dados de outros utilizadores.

O carrinho não reserva stock: a Fase 7 deve revalidar tudo na criação do pedido e fazer a reserva transaccional. A fusão reduz quantidades caso o stock tenha diminuído desde a adição.

## Persistência e diagnóstico

Migration `20261022120000_marketplace_query_indexes` adiciona índices compostos de produtos activos/categoria/data, variantes activas/preço, galeria, favoritos e avaliações públicas. Aplicada na BD local com `npm run db:migrate:deploy`.

Executar `npx tsx scripts/explain-marketplace.ts` para observar o plano da pesquisa pública. No seed local de aproximadamente 40 produtos e 44 variantes, PostgreSQL preferiu scan sequencial para as tabelas pequenas e utilizou `sellers_status_idx`. Isto é esperado para este volume e não demonstra o comportamento com catálogo de produção; repetir com dados representativos e observar buffers/tempo antes do lançamento.

## Verificação e pendências

- `npm run build`: passou; todas as rotas foram geradas. Next mostra aviso de depreciação da convenção `middleware` em favor de `proxy`, pendente de migração separada.
- `npm run lint`: passou.
- Verificação TypeScript incluída em `next build`: passou.
- `npm test`: 10 ficheiros / 56 testes passaram, incluindo catálogo e fusão de carrinho multi-vendedor. O driver `pg` mostra aviso de concorrência já existente durante o teste de inventário.
- Layout revisto em desktop e 360 px; overflow de cabeçalho foi corrigido.
- Fotos reais do catálogo ainda não existem no seed; os placeholders são intencionais.
- Checkout, criação de `Order`/`SellerOrder`, reserva e expiração de stock permanecem na Fase 7.
