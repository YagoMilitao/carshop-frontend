# CARSHOP-114 — Definir e configurar estratégia de renderização e SEO técnico no Next.js

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Público
- **Component**: Public UI, Infra, Quality
- **Stack**: Frontend
- **Sprint**: Sprint 3
- **Priority**: High
- **Points**: 5
- **Status**: To Do

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-114` no Notion
Task Tracker (não duplicadas aqui além do necessário para orientar o
trabalho — ver seção DoD resumido abaixo).

## Objetivo

Estabelecer a fundação técnica de renderização (Server Components vs Client
Components vs static/dynamic rendering/revalidation) e de SEO técnico
(metadata API do Next.js, `html lang`, Open Graph, robots.txt, sitemap,
canonical URLs) para o CarShop, sem antecipar copy final de negócio nem
implementar todas as páginas públicas ainda inexistentes.

## Estado real do repositório (verificado nesta sessão)

- Confirmado: a migração para Next.js App Router (`CARSHOP-113`) está em
  vigor. `package.json` usa `next dev`/`next build`/`next start` (Next
  `^16.3.4`, React `^19.2.0`), sem mais scripts/config de Vite (o único
  `vite.config.ts` remanescente é de uma dependência em `node_modules`, não
  do projeto). Esta task pode prosseguir com a stack Next.js como premissa
  válida.
- `next.config.mjs` existe mas está vazio (config default) — nenhuma
  configuração de `images`, redirects, headers ou i18n definida ainda.
- Estrutura de rotas atual em `app/`:
  - `app/layout.tsx` (root layout, com `export const metadata` básico)
  - `app/(public)/layout.tsx` + `app/(public)/page.tsx` (Home — única
    página pública implementada; conteúdo placeholder "em construção")
  - `app/(admin)/admin/layout.tsx` + `app/(admin)/admin/page.tsx` (Admin —
    único ponto admin implementado; layout passthrough, sem lógica)
  - `app/error.tsx`, `app/not-found.tsx`, `app/providers.tsx`
  - **Não existem ainda** rotas/páginas para About, Services, Portfolio,
    Project Details ou Contact. O DoD desta task pede estratégia
    documentada para essas páginas, mas nenhuma delas tem arquivo de rota
    criado no repositório atual.
- Nenhum `robots.ts`/`robots.txt` ou `sitemap.ts`/`sitemap.xml` existe hoje
  em `app/`.

## Decisões do usuário (resolvidas)

1. **Idioma**: migrar `app/layout.tsx` para `<html lang="en-US">` agora,
   incluindo `title`/`description` base do metadata raiz em inglês (alinhado
   ao objetivo de portfólio comercial nos EUA). Copy final de marketing
   continua fora de escopo — apenas o metadata técnico/estrutural do layout
   raiz muda de idioma nesta task.
2. **Páginas inexistentes**: além de documentar a estratégia de
   renderização/SEO, criar **stubs de rota** (placeholder, sem copy de
   negócio) para About, Services, Portfolio, Project Details e Contact,
   aplicando a fundação de metadata (`Metadata`/`generateMetadata`) em cada
   uma. Project Details usa `generateMetadata` assíncrono preparado para
   dados reais da API quando a feature existir (placeholder controlado
   enquanto não há dados).

## Escopo técnico (fundação, sem copy final de negócio)

1. **Documento de estratégia de renderização por página** (Home, About,
   Services, Portfolio, Project Details, Contact, Admin), distinguindo:
   - conteúdo estático (SSG/`generateStaticParams` quando aplicável),
   - conteúdo dinâmico com revalidação (ISR / `revalidate`),
   - conteúdo client-side (interatividade que exige Client Component),
   - critério: decisão por característica do dado, não regra única global.
2. **Metadata base da aplicação** via `Metadata`/`generateMetadata` API do
   Next.js (`app/layout.tsx` e por rota), incluindo fundação para
   `title`/`description` por página (sem inventar copy de negócio).
3. **`html lang`** apropriado ao conteúdo principal (ver conflito acima).
4. **Metadata dinâmica de Project Details**: estratégia definida a partir de
   dados reais da API (`generateMetadata` assíncrono), condicionada à
   feature existir — não implementar sem dados reais disponíveis.
5. **Open Graph / social sharing**: fundação (`openGraph` em `Metadata`)
   definida, sem imagens/copy fictícios.
6. **`robots.txt`** e **`sitemap`**: configurados via `app/robots.ts` /
   `app/sitemap.ts` (Next.js Metadata Files API) ou, se dependerem de dados
   ainda não disponíveis (ex.: lista de projetos via API), a implementação é
   explicitamente planejada com as dependências reais documentadas.
7. **Canonical URLs**: consideradas onde aplicável via `alternates.canonical`.
8. **Admin**: nunca tratado como conteúdo público indexável — `robots`
   `noindex` explícito e exclusão de sitemap para rotas `(admin)`.
9. **Cache/revalidation**: política documentada; nada sensível/autenticado
   pode ser cacheado como público.
10. **Validação**: build/lint/typecheck passam; Lighthouse/SEO básico (ou
    equivalente) executado quando houver página suficiente para medir.

## Fora de escopo

- Copy final de marketing/negócio para qualquer página (stubs usam
  placeholder mínimo, não texto de marketing final).
- Migração de conteúdo Admin (fora do escopo de SEO por definição do DoD).
- Qualquer integração real com a API de projetos além do necessário para
  planejar (não implementar) a metadata dinâmica de Project Details, caso a
  feature ainda não exista no backend.

## Classificação de tamanho: NON-TRIVIAL

Justificativa: a task envolve decisão arquitetural explícita (estratégia de
renderização por tipo de página, Server vs Client Components), toca
múltiplas áreas (root layout, novo `robots.ts`/`sitemap.ts`, metadata por
rota, config do Admin) e tem um conflito de escopo (idioma `pt-BR` vs
`en-US`) que precisa de decisão do usuário antes da implementação — critérios
de `NON-TRIVIAL` conforme fluxo do projeto. **Plano obrigatório via
`plan-writer`.**

## Próximos agentes necessários

1. **Sinalizar ao usuário** os dois pontos de conflito de escopo acima antes
   de prosseguir (idioma `en-US` vs `pt-BR` atual; páginas inexistentes).
2. `knowledge-reader` — consultar Obsidian (`CarShop/Architecture`,
   `CarShop/ADRs`) por decisões prévias sobre rendering strategy, i18n ou
   SEO já registradas, e `CarShop/Studies` como não vinculante.
3. `architect` — decidir Server vs Client Components por página e a
   estratégia de rendering/revalidation concreta (somente leitura, conforme
   `docs/rules/rendering.md`).
4. `plan-writer` — persistir `plan.md` (task NON-TRIVIAL).
