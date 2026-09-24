# CARSHOP-145 — Redesenhar Portfolio público com layout editorial orientado a fotografia

## Referência

Tarefa no Notion: CARSHOP-145 (Description, DoD de 9 itens e Technical Notes
completos na tarefa — aqui só o essencial).

Sprint 6 · Priority High · 5 pts · Epic Frontend Público · Component: Public
UI, Works · Branch `feat/CARSHOP-145`, **empilhada sobre `feat/CARSHOP-144`**
(ainda não mergeada em `master` — decisão do usuário). **Sem Figma aprovado
localizado**: fonte visual autoritativa é `docs/design/*`, em especial
`components.md` → "Project Presentation", "Project Card Rule", "Portfolio
Grid", "Project Image Interaction", "Loading States", "Image Loading",
"Empty States", "Error States"; `spacing.md` → "Portfolio Layout",
"Portfolio Image Gap", "Asymmetry", "Grid System"; `imagery.md` → "Editorial
Composition", "Image Ratios", "Aspect Ratio Rule", "Image Cropping",
"Object Position"; `visual-direction.md` → "Our Work", "Anti-SaaS Rule".

Relacionadas: CARSHOP-23 e CARSHOP-116 (concluídas — **não reabrir**),
CARSHOP-34/35 (listagem e Project Details), CARSHOP-143 (shell público),
CARSHOP-144 (Home; decisões reaproveitadas: copy pública em inglês,
`category` exibida como vem da API, nenhuma informação de negócio inventada,
"Get a Quote" desabilitado, `cn` importado de `@/lib/utils`).

Objetivo: refatorar **somente apresentação/UX** de `/portfolio`,
transformando a lista atual em uma experiência editorial em que trabalhos e
fotografias reais dominam, preservando integração, routing e estratégia de
rendering (Technical Notes).

## Estado atual do repositório (investigação)

### `/portfolio` (`app/(public)/portfolio/`)

- `page.tsx`: Server Component async. Chama `getWorks()` em `try/catch`;
  sem `export const revalidate`/`dynamic` — ISR herdado do `fetch`
  (`revalidate: 3600`, `tags: ['works']`).
  - Sucesso: lista vertical (`divide-y`) de `Link` → `/portfolio/${slug}`
    com `aria-label={work.title}`, miniatura `WorkImageThumb` **96px
    quadrada** (`size-24`, `sizes="96px"`) apenas quando há capa, `category`
    (`text-label`) e título (`text-heading-3`, em `span`, não heading).
    Works sem capa aparecem só com texto.
  - Erro: `ErrorToast` + parágrafo inline, ambos em **pt-BR**.
  - Vazio: "Nenhum projeto publicado ainda." (**pt-BR**), sem ação.
  - `PageSection spacing="editorial"` + `h1` "Portfolio" (`text-display-lg`).
- `metadata`: title `Portfolio`, description **pt-BR** ("Confira os
  projetos e trabalhos realizados pela CarShop."), canonical absoluto via
  `NEXT_PUBLIC_SITE_URL`, `openGraph` title/description.
- `error.tsx` (Client, `'use client'`): toast + `h1`/parágrafo/botão
  "Tentar novamente" — **pt-BR**, estilo genérico (`text-lg font-semibold`,
  centralizado), fora do sistema tipográfico público.
- **Não existe `loading.tsx`** em `/portfolio` nem em `app/(public)/`.
- Testes: `page.test.tsx` (listagem, sem capa, com capa, metadata, erro,
  vazio — asserts em strings pt-BR), `error.test.tsx` usando o helper
  compartilhado `error-boundary.test-helpers.tsx`, que **fixa o texto do
  botão "Tentar novamente"** e também é usado por
  `[slug]/error.test.tsx`.

### `/portfolio/[slug]` (apenas limite de escopo)

- Rota existente com `generateStaticParams`, `generateMetadata`, galeria,
  comentários e `error.tsx` próprios (também em pt-BR). Os links da
  listagem apontam para `/portfolio/${work.slug}` — contrato de navegação a
  preservar. Nenhuma alteração prevista nesta task (ver Escopo).

### Home (CARSHOP-144, nesta branch)

- `app/(public)/_components/project-preview.tsx`: `Link` único para
  `/portfolio/[slug]`, `WorkImageThumb` 4:3 via `className`, `category` +
  `h3`, `emphasis: 'dominant' | 'supporting'` com `sizes` por ênfase.
  Tipado com `HomeWork` (`app/(public)/_lib/select-home-works.ts`, que
  filtra apenas works com capa).
- `featured-works.tsx`: composição 8/4 colunas (dominante + apoio).
- Decisão do `architect` na 144: não alterar `WorkImageThumb`,
  `PageSection`/`Container`, `lib/api/*`; proporções via `className`.

### Primitives disponíveis

`WorkImageThumb` (`next/image` `fill`, default `aspect-square rounded-lg`,
sobrescrevível; também usado por `WorkGallery` e pela Home), `PageSection`,
`Container`, `components/ui/skeleton`, `button`, `ErrorToast`, tokens
tipográficos (`text-display-*`, `text-heading-*`, `text-label`, `text-body*`,
`text-nav`), `react-icons/lu`. `next.config.mjs` permite imagens apenas de
`res.cloudinary.com`.

## Dados realmente disponíveis

Fonte única: `getWorks()` (`lib/api/works.ts`, `GET /works`, público, sem
paginação, somente publicados, ISR 1h, retry/backoff, timeout 10s).

| Campo | Uso possível na listagem |
| --- | --- |
| `slug`, `title` | Link e título do projeto |
| `category` (string livre, valores do backend em pt-BR, ex.: "Estofamento") | Eyebrow/metadata, exibida como vem da API |
| `description` | Resumo curto opcional (texto real) |
| `tags[]` | Metadata opcional |
| `images[]` (`url` Cloudinary, `alt`, `isCover`, `order`) | Fotografia; capa via `getCoverImage()` |
| `createdAt`/`updatedAt` | Disponíveis, mas **não** representam data de execução do trabalho — não exibir como tal |

Limitações relevantes:

- **Sem largura/altura/orientação/focal point** das imagens no contrato →
  a proporção "semântica" (DoD 5) só pode ser escolhida pelo **papel da
  imagem no layout** (projeto em destaque vs. apoio vs. detalhe), não pela
  proporção original da foto. `object-position` por imagem também não é
  derivável de dados.
- **Sem campo `featured`**, sem ordenação por relevância, sem paginação,
  sem endpoint de categorias. Ordem = ordem da API.
- Works podem não ter capa (`isCover`) ou não ter nenhuma imagem.
- Quantidade de works publicados é desconhecida: o layout precisa
  funcionar com 1, 2, número ímpar e N works.

Nenhum endpoint novo é necessário nem deve ser criado.

## Decisão de escopo: `/portfolio/[slug]`

**Fora de escopo.** Título ("Portfolio público", listagem), Description
("transformando a listagem") e DoD (itens 2–7 sobre listagem; item 3 exige
apenas que os previews **naveguem corretamente** para `/portfolio/[slug]`)
tratam da página de listagem. Project Details só entra como destino de
navegação, que deve continuar funcionando sem alteração. Redesenho de
Project Details deve ser task própria.

## Conflitos / pontos em aberto (decisão do usuário antes de prosseguir)

1. **Idioma das mensagens de estado e da metadata** (mismatch conhecido).
   `/portfolio` tem estados de erro/vazio, `error.tsx` e metadata
   description em pt-BR, enquanto o shell público e a Home (CARSHOP-143/144)
   usam copy em inglês. DoD 4 exige estados "no mesmo sistema visual".
   Recomendação: migrar toda a copy de `/portfolio` (estados, `error.tsx`,
   metadata description/OG) para inglês, sem claims inventados, mantendo
   title/canonical/OG estruturalmente iguais (DoD 8). `category` continua
   como vem da API (pt-BR).
2. **Helper de teste compartilhado com Project Details.**
   `error-boundary.test-helpers.tsx` fixa "Tentar novamente" e é usado
   também por `[slug]/error.test.tsx`. Traduzir `portfolio/error.tsx` exige
   parametrizar o texto do botão no helper (mudança só de teste), mantendo
   `[slug]/error.tsx` em pt-BR — o que deixa as duas rotas públicas
   inconsistentes até uma task futura. Alternativa: traduzir também
   `[slug]/error.tsx` (toca Project Details, fora do escopo declarado).
   Recomendação: parametrizar o helper, não tocar `[slug]` e registrar
   follow-up para o idioma de Project Details (erro e comentários).
3. **Works sem imagem de capa.** A lista atual mostra works sem capa só com
   texto; a Home os omite. Numa listagem que deve representar todos os
   trabalhos publicados, omitir esconde conteúdo real. Opções:
   (a) usar a primeira imagem por `order` quando não houver `isCover`, e
   entrada tipográfica (sem placeholder falso) quando não houver imagem;
   (b) entrada tipográfica sempre que não houver capa;
   (c) omitir. Recomendação: (a), resolvido na camada de apresentação (sem
   alterar `getCoverImage`/`lib/api`).
4. **`loading.tsx` inexistente.** DoD 4 cita loading state, mas a rota é
   ISR/estática e hoje não há `loading.tsx`; ele raramente seria exibido
   (principalmente em navegação client sem prefetch ou em revalidação sem
   cache). Recomendação: criar `app/(public)/portfolio/loading.tsx` com
   skeleton contido que espelhe a composição editorial (mesmas proporções,
   sem animação exagerada, sem CLS), sem alterar a estratégia de rendering.
   Confirmar se o usuário prefere não criar.
5. **Reuso de `ProjectPreview` da CARSHOP-144 (branch empilhada).**
   `ProjectPreview` está colocado como componente da Home e tipado com
   `HomeWork`. Reutilizá-lo exige generalizar/mover (ex.: para
   `components/` ou `app/(public)/_components` com tipo neutro), o que
   altera código da 144 ainda não mergeada; criar outro componente
   duplica padrão. Decisão do `architect`; recomendação do spec: extrair um
   preview de projeto público compartilhado com tipo neutro (`{ work,
   image | null }`) e ajustar a Home sem mudança visual, cobrindo com os
   testes existentes da 144. Risco: conflitos se a 144 mudar antes do merge.
6. **Composição editorial vs. grid.** `components.md`/`visual-direction.md`
   admitem grid na página de browsing, mas o DoD 2 pede evitar "grid de
   cards SaaS uniforme por padrão". Sem Figma, a composição (ex.: projeto
   de abertura dominante + ritmo alternado de pares assimétricos 7/5 ↔ 5/7)
   é decisão do `architect` com base em `docs/design/`, sem aleatoriedade
   visual e com ordem de leitura linear no mobile.

Pontos menores (sem bloqueio, decisão do `architect`): manter `h1`
"Portfolio" (alinhado ao title/metadata; o nav usa "Our Work") e
introdução curta sem claims; exibir ou não `description`/`tags` no preview;
estratégia de `object-position` (default centro é o único possível sem
focal point — registrar como limitação).

## Escopo

- Refatorar a apresentação de `app/(public)/portfolio/page.tsx` mantendo
  Server Component, `getWorks()` sem alterações, ISR atual, `metadata`
  estática e `href` `/portfolio/${slug}`.
- Composição editorial orientada a fotografia (Conflito 6), com proporções
  de um conjunto controlado (16:9, 4:3, 3:4; quadrado evitado como padrão)
  escolhidas pelo papel no layout.
- Preview de projeto: `Link` único e acessível, imagem dominante, `category`
  e título como heading (`h2`, sob o `h1` da página), sem container de card,
  sem sombra/borda/fundo; hover sutil respeitando `prefers-reduced-motion`.
- Tratamento de works sem capa conforme Conflito 3.
- Estados de erro (inline da página + `error.tsx`), vazio e loading
  (Conflito 4) no mesmo sistema visual/tipográfico, calmos, explicando o que
  falhou/o que falta e a próxima ação (ex.: retry no `error.tsx`; link para a
  Home ou nenhum CTA inventado no vazio), no idioma decidido no Conflito 1.
- `next/image`: `sizes` coerentes com cada coluna/breakpoint; `priority`
  somente na primeira imagem acima da dobra (LCP); demais com lazy loading
  padrão; contêiner com aspect-ratio fixo (sem CLS); alt `image.alt ||
  work.title`.
- Atualização da metadata description/OG apenas se Conflito 1 aprovar,
  preservando title, canonical e estrutura OG.
- Testes: reescrever/estender `page.test.tsx` (sucesso com N works, sem
  capa, sem imagens, links, `priority` apenas no primeiro, erro, vazio,
  metadata), `error.test.tsx`/helper (Conflito 2), teste do `loading.tsx`
  se criado, e testes do preview compartilhado (Conflito 5).

## Fora de escopo

- `/portfolio/[slug]` (Project Details): layout, galeria, comentários,
  `error.tsx`, metadata, `generateStaticParams` — exceto ajuste de teste
  compartilhado do Conflito 2.
- Reabrir CARSHOP-23/116; alterar `lib/api/*`, cache/ISR/tags,
  `force-dynamic`, Route Handlers ou contrato do backend.
- Adicionar campos no backend (`featured`, dimensões, focal point,
  categorias) — registrar como dependência se desejado.
- Filtros por categoria, busca, paginação/infinite scroll (não pedidos e
  sem suporte no contrato).
- Before/after, testimonials, stats, business info, alteração de
  Header/Footer, habilitar "Get a Quote".
- `sitemap.ts` (não deve ser afetado).
- Alterações em `WorkImageThumb` que mudem o comportamento de `WorkGallery`
  ou da Home (se necessário, apenas aditivas e decididas pelo `architect`).
- Imagens stock/IA ou placeholders apresentados como trabalho real.

## Critérios de aceite (derivados do DoD)

1. `/portfolio` continua usando `getWorks()`/`getCoverImage()` sem mudança
   em `lib/api/*`; nenhum dado inventado.
2. Fotografia é o elemento dominante; nenhum grid uniforme de cards
   (fundo/borda/sombra/rounded box) como padrão.
3. Todo preview é um link único para `/portfolio/${slug}` com nome acessível
   igual ao título; navegação verificada na app rodando.
4. Estados de erro, vazio, loading (se criado) e `error.tsx` usam os tokens
   públicos e o idioma decidido; erro de API não gera 500 na página.
5. Nenhuma imagem forçada a quadrado por padrão; proporções do conjunto
   16:9/4:3/3:4 justificadas pelo papel no layout.
6. `next/image` com `sizes` por breakpoint, `priority` só na imagem LCP,
   lazy nas demais, sem CLS.
7. Mobile/tablet/desktop verificados no dev server; ordem de leitura linear;
   um único `h1`, headings hierárquicos, foco visível, touch targets ≥ 44px,
   contraste WCAG, hover com `motion-safe`/`motion-reduce`.
8. Metadata (title, canonical, OG) e rendering (Server Component + ISR) sem
   regressão; `generateStaticParams`/sitemap intactos.
9. `lint`, `typecheck`, `build` e testes relevantes passam (incluindo
   testes da Home/144 e de `[slug]` afetados por componentes/helpers
   compartilhados); cobertura ≥ 80% no código novo/alterado.

## Riscos

- Branch empilhada na CARSHOP-144: mudanças em componentes da Home podem
  conflitar com ajustes pendentes da 144 antes do merge.
- Crop cego (sem dimensões/focal point) pode cortar costuras/detalhes,
  sobretudo em 3:4; preferir 4:3/16:9 onde a foto é desconhecida.
- Listagem sem paginação: muitas imagens grandes — `sizes` corretos e lazy
  loading são essenciais.
- Helper de teste compartilhado com `[slug]` (Conflito 2).
- Categorias em pt-BR ao lado de copy em inglês (limitação de dados,
  mantida por decisão da 144).

## Classificação de tamanho

**NON-TRIVIAL** — redesenho de página inteira com decisões de UI/arquitetura
(composição editorial, proporções, estratégia de imagem/LCP, boundaries de
componente e possível extração de componente compartilhado com a Home),
múltiplos arquivos (`page.tsx`, `error.tsx`, `loading.tsx` novo, preview
compartilhado, testes e helper de teste) e conflitos que exigem decisão do
usuário. Plano persistido obrigatório.

## Próximos agentes

- `knowledge-reader`: recomendado — notas das CARSHOP-34/35/116/144 no
  Obsidian (padrões de imagem, testes de Server Components async, decisões
  da Home).
- `architect`: obrigatório — composição editorial, proporções por papel,
  `sizes`/`priority`, reuso/extração de `ProjectPreview`, estados
  (loading/erro/vazio), após as decisões do usuário nos Conflitos 1–4.
- `plan-writer`: obrigatório.
