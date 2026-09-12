# CARSHOP-25 — Criar galeria de imagens

## Referência

Notion Task Tracker: CARSHOP-25 (Epic: Frontend Público, Sprint 3, Priority:
Medium, Stack: Frontend, Component: não preenchido, Status: Backlog). Ver
descrição completa, DoD e notas técnicas na task original — não duplicadas
aqui.

## Contexto no repositório (estado atual)

- A entidade `Work` já existe em `lib/api/works.ts` (Server-only, `fetch`
  nativo, ADR-001) e já inclui um array de imagens tipado:
  `Work.images: WorkImage[]` (`{ id, url, publicId, alt, isCover, order,
  createdAt, updatedAt }`). Portanto **a dependência "Endpoint de works com
  imagens" citada na task já está satisfeita** — não é um bloqueio real, é
  dado já consumido hoje só para a imagem de capa (`getCoverImage`).
- `app/(public)/portfolio/page.tsx` lista works (`getWorks()`) apenas como
  links de texto — sem nenhuma imagem renderizada.
- `app/(public)/portfolio/[slug]/page.tsx` (Server Component) já busca o
  `work` completo e usa `getCoverImage(work)` só para metadata/OpenGraph;
  o corpo da página não renderiza nenhuma imagem nem galeria.
- **Não existe** nenhum componente de galeria, carrossel ou lightbox no
  repositório (`Glob` por `*allery*`, `*ightbox*`, `*arousel*` não retornou
  nada em `app/`, `components/` ou `lib/`).
- **Não existe** nenhuma dependência de carrossel/lightbox no
  `package.json` (dependencies/devDependencies conferidos). O stack atual
  para isso é: `framer-motion` (^13.2.0, já instalado, dá para animar
  transições) e `radix-ui`/Shadcn (sem primitiva de lightbox pronta).
  `next/image` (parte do `next`) ainda não é usado em nenhuma página
  pública auditada.

## Decisão de escopo (confirmada pelo usuário)

A galeria/lightbox será implementada com o stack já instalado, sem novas
dependências: grid responsivo com Tailwind, `Radix Dialog` (via `radix-ui`)
para o lightbox e `Framer Motion` para transições. Nenhuma lib de terceiros
dedicada (embla-carousel, yet-another-react-lightbox etc.) será adicionada
nesta task.

## Escopo proposto

- Componente de galeria reutilizável (grid responsivo de `WorkImage`),
  usado na página de detalhe do projeto (`app/(public)/portfolio/[slug]/page.tsx`),
  usando `work.images` (ordenado por `order`), já disponível hoje.
- Lightbox: abrir imagem em destaque ao clicar, com navegação entre as
  imagens do mesmo work.
- Lazy loading de imagens (via `next/image` com `loading="lazy"`
  ou padrão, a confirmar com `architect`/`knowledge-reader` por conta da
  regra de Server/Client Components).
- Fora de escopo: qualquer alteração no backend Express (não migrar rotas,
  não mexer no schema de `Work`/`WorkImage`) e qualquer alteração na
  listagem `app/(public)/portfolio/page.tsx` além do necessário para
  reaproveitar o componente de galeria, se aplicável (a decidir com
  `architect`).

## Componentes/arquivos provavelmente envolvidos

- Novo componente `components/gallery/*` (ou local, a decidir pelo
  `architect` conforme convenção de pastas do projeto).
- `app/(public)/portfolio/[slug]/page.tsx` (Server Component) — consumir o
  novo componente de galeria.
- Possível Client Component isolado para o lightbox (interatividade =
  estado local), respeitando `docs/rules/rendering.md`.
- Testes correspondentes (Vitest + Testing Library), seguindo
  `docs/rules/testing.md`.

## Critérios de aceite (derivados do DoD "Galeria funcional e responsiva")

1. A página de detalhe de um `Work` (`/portfolio/[slug]`) exibe as imagens
   do work em grid ou carrossel.
2. Clicar em uma imagem abre-a em destaque (lightbox), acessível via
   teclado e leitor de tela (`docs/rules/accessibility.md`).
3. Layout responsivo em mobile/tablet/desktop (`docs/rules/responsive.md`).
4. Imagens carregam com lazy loading (evitar carregar todas de uma vez).
5. Nenhuma regressão nos testes existentes de `portfolio/[slug]/page.test.tsx`
   e `portfolio/page.test.tsx`.

## Riscos

- Performance/otimização de carregamento (explicitamente citado como risco
  na task) — mitigar com `next/image`, lazy loading e possivelmente
  dimensões/`sizes` corretos.
- Decisão de lib de terceiros pendente (ver bloqueio acima) pode mudar a
  estimativa de esforço.
- Nenhum design/mockup foi referenciado nas Notas Técnicas (vazias) —
  pode ser necessário validar visual com o usuário antes de finalizar.

## Classificação de tamanho: NON-TRIVIAL

Motivo: a task envolve (a) decisão arquitetural em aberto sobre lib de
terceiros vs. stack já instalado, (b) decisão de Server vs. Client
Component para o lightbox interativo, (c) toca em múltiplos
arquivos/áreas (componente novo de galeria, página de detalhe do
portfolio, possivelmente a listagem, mais testes), e (d) tem um requisito
não funcional explícito (otimização de carregamento) que merece plano
antes da implementação.

## Próximos agentes necessários

- `knowledge-reader`: consultar Obsidian (`CarShop/Architecture`,
  `CarShop/ADRs`, `CarShop/Studies`) por decisões prévias sobre
  Server/Client Components, uso de `next/image`, ou avaliação de libs de
  carrossel/lightbox já discutidas.
- `architect`: decidir Server vs. Client Components para a galeria/lightbox
  e a estrutura de pastas do componente, respeitando
  `docs/rules/rendering.md` e `docs/rules/routing.md`. Deve também levar
  o bloqueio de lib de terceiros ao usuário antes de finalizar a decisão.
- `plan-writer`: plano obrigatório (`plan.md`) dado o tamanho NON-TRIVIAL.
