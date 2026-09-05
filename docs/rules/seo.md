# Regra: SEO e Metadata

- Quando o App Router estiver em uso, metadata (title, description, Open
  Graph, etc.) usa a API de metadata do Next.js por rota/página, não tags
  manuais duplicadas.
- Conteúdo público prioriza Server Components/renderização do Next quando
  apropriado, favorecendo indexação (ver
  [docs/rules/rendering.md](./rendering.md)).
- `reviewer` valida metadata/SEO nas páginas públicas tocadas pela task,
  quando aplicável.
