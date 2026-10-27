export function getCatalogUnavailableDescription() {
  if (process.env.NODE_ENV === "development") {
    return "A base de dados local não respondeu. Inicie o PostgreSQL (Docker: npm run db:up; sem Docker, configure uma instalação local e DATABASE_URL), depois execute npm run db:migrate e npm run db:seed.";
  }

  return "O catálogo está temporariamente indisponível. Tente novamente dentro de instantes.";
}
