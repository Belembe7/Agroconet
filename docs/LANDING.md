# Fase 5 — Página inicial Agroconet

A página `/` aplica a direcção visual 02 aprovada. Inclui header com navegação desktop/móvel, hero com pesquisa, categorias, até oito produtos em destaque, como funciona, chamada para vendedores, cobertura logística, compromissos e footer com contactos.

## Dados públicos

`src/services/catalog/landing-service.ts` concentra as consultas e regras públicas. Só aparecem produtos ACTIVE sem soft delete, com categoria activa, vendedor APPROVED não apagado e conta do vendedor activa. É obrigatória pelo menos uma variante activa. Categorias sem produtos públicos ficam ocultas. Não se publicam IDs internos de utilizadores, documentos ou dados de encomendas.

A opção de menor preço entre variantes activas define o valor “A partir de”. O preço mantém-se em centavos inteiros, formatado com Intl MZN. O estado de stock dessa opção desconta quantityReserved de quantityOnHand; não se garante stock ou preço no checkout nesta fase.

Os contactos vêm exclusivamente de SystemSetting `company.contacts` (phone, email, city), com validação Zod antes de criar links tel/mailto. As zonas vêm de DeliveryZone activa. Os nomes e preços visíveis em desenvolvimento incluem os marcadores `[DEV]` do seed existente.

O seed tem chaves de armazenamento para imagens que não correspondem a ficheiros reais. Os produtos mostram um placeholder explícito “Fotografia em breve”. A imagem do hero é o asset ilustrativo gerado da Fase 4; não representa um cliente ou exploração verificados.

## Pesquisa e limites da fase

Os formulários GET pesquisam na própria landing: `/?q=milho#destaques`. As categorias usam `/?categoria=sementes#destaques`. O campo de pesquisa nos destaques preserva a categoria e permite limpar filtros. Pesquisa case-insensitive por nome, marca e descrição, com limite de 100 caracteres. Valores repetidos ou slug inválido são ignorados; Prisma parametriza as consultas.

Este é um recorte de até oito produtos recentes, não o catálogo completo. `/produtos`, detalhe, paginação, favoritos, carrinho e checkout ficam para as Fases 6–7. Os cartões não apontam para páginas inexistentes. A chamada a vendedores leva aos contactos, sem prometer candidatura automática. O percurso de compra descrito nesta fase é consulta e confirmação pela equipa.

## Renderização e SEO

Componentes servidor e Suspense preservam o hero estático enquanto os dados carregam. Funções públicas em `features/landing/data.ts` usam `use cache`, `cacheLife("minutes")` e tags `landing`, `categories`, `products`, `company-contacts`, `delivery-zones`. Falhas não se transformam em montras fictícias: cada secção tem mensagem de erro ou vazio. Futuras mutações devem revalidar as tags correspondentes; não há cache partilhada de sessão.

A navegação pública usa links sem o primitivo de botão cliente. O Toaster fica apenas no guia que o utiliza, reduzindo JavaScript na landing. A imagem principal usa carregamento eager, fetchPriority high e qualidade 60 permitida em next.config. A fonte editorial não é pré-carregada no percurso crítico; as fontes usam font-display optional para não atrasar a leitura inicial. Em mobile, a apresentação do hero é imediata, sem animação de entrada. Links do header não fazem prefetch automático. Secções abaixo do hero usam content-visibility auto, quando suportado, para adiar layout fora do ecrã, mantendo o conteúdo no HTML e acessível por âncoras.

Metadata inclui título, descrição, canonical `/`, Open Graph/Twitter e metadataBase obtida de NEXT_PUBLIC_APP_URL. Existe ícone SVG da marca. Sitemap e robots dinâmicos continuam na Fase 6. A pesquisa mantém canonical na página inicial.

## Validação

- 51 testes passaram: unitários e integração, incluindo stock concorrente e visibilidade pública da landing.
- Testes da landing criam fixtures numa transacção revertida, sem deixar produtos de teste publicados.
- Build de produção, typecheck e lint verificados.
- Navegador: pesquisa “milho”, pesquisa sem resultado, limpeza, dados do seed e contactos da BD observados. Revisão a 360 px sem overflow e desktop a 1360 px.
- Auditoria móvel local: `docs/lighthouse-home-mobile.json`; configuração em `scripts/lighthouse.config.cjs`. Lighthouse móvel local (produção, Chrome headless, rede/CPU simuladas): performance 76, acessibilidade 100, boas práticas 100, SEO 100; LCP 3,7 s, TBT 310 ms, CLS 0. A meta de performance móvel elevada ainda não foi atingida; fica como pendência explícita da Fase 5. Não confundir o build verde e testes passados com cumprimento desse critério.

Repetir auditoria com build de produção, PostgreSQL activo e servidor na porta 3001. A medição é local com Lighthouse e Chrome headless, não dados de utilização real.

Antes de publicar: substituir contactos de desenvolvimento, carregar fotografias reais dos produtos, confirmar termos comerciais e zonas. A próxima etapa funcional é a Fase 6, mediante AVANÇAR.
