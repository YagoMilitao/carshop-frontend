# CARSHOP-146 — Redesenhar Project Details e galeria como narrativa do trabalho

## Referência

Tarefa no Notion: CARSHOP-146 (Description, DoD de 8 itens e Technical Notes
completos na tarefa — aqui só o essencial).

Sprint 6 · Priority High · 5 pts · Component: Public UI, Works, Comments ·
Branch `feat/CARSHOP-146` (a partir de `master`, que já contém a CARSHOP-145,
commit `f60de68`). **Sem Figma aprovado**: fonte visual autoritativa é
`docs/design/*`, em especial `components.md` → "Project Details", "Gallery",
"Gallery Modal", "Before & After"; `imagery.md` → "Craftsmanship Detail
Photography", "Wide vs Detail Balance", "Before & After", "Project
Galleries", "Editorial Composition", "Image Ratios", "Aspect Ratio Rule",
"Image Cropping", "Object Position", "Performance", "Layout Shift", "Mobile
Images", "Accessibility", "Alt Text and Project Data", "Placeholder
Strategy"; `spacing.md` e `typography.md` para ritmo e hierarquia.

Relacionadas: CARSHOP-25/CARSHOP-116 (históricas/Done — **não reabrir**),
CARSHOP-34/35 (criação de Project Details/galeria), CARSHOP-117 (backend:
`GET /works/{slug}`), CARSHOP-145 (listagem editorial; padrões reaproveitados
— ver "Padrões herdados").

Objetivo: refatorar a apresentação/UX de `/portfolio/[slug]` e da galeria
para narrar o trabalho realizado, preservando dados reais, metadata,
comentários, `notFound` e rendering, e passar a consumir o endpoint real
`GET /works/{slug}` (decisão do usuário — sem alterar o contrato da API).

## Decisões validadas pelo usuário

1. **Endpoint**: migrar `getWorkBySlug` para o endpoint real
   `GET /works/{slug}` (existe no contrato do backend, CARSHOP-117). Muda
   apenas o **consumo** em `lib/api/works.ts`; o contrato da API não muda.
   Detalhes em "Migração para `GET /works/{slug}`".
2. **Idioma**: inglês em toda a copy da página, galeria, lightbox,
   comentários, formulário e estados de erro/404. Dados da API (`title`,
   `description`, `category`, `tags`, `alt`, comentários) ficam intactos.
   O helper `error-boundary.test-helpers.tsx` já aceita `retryButtonText`;
   `[slug]/error.test.tsx` passa a usar o texto em inglês.
3. **404**: criar `app/(public)/portfolio/[slug]/not-found.tsx` no sistema
   visual público. **Nenhum `loading.tsx`** em `app/(public)/portfolio/`
   (nem em `[slug]/`). HTTP 404 real validado com `next build && next
   start`.
4. **CommentForm**: alinhar o schema Zod ao contrato — `authorName` 2–80,
   `content` 3–1000 caracteres (com `trim` coerente com a validação do
   backend, a confirmar pelo `architect`), mantendo o `refine` que rejeita
   HTML. Mensagens em inglês.
5. **Lightbox mantido**: `object-contain` (visão íntegra da foto), copy em
   inglês, transição respeitando `prefers-reduced-motion`.

## Estado atual do repositório (investigação)

### Rota `app/(public)/portfolio/[slug]/`

- `page.tsx` (Server Component async):
  - `generateStaticParams()` via `getWorks()` com fallback `[]` em erro.
  - `generateMetadata()` e página usam `getWorkBySlug(slug)` (hoje:
    `GET /works` + filtro no servidor) → `notFound()` se `undefined`.
    Metadata: title `${title} — CarShop`, `description`, OG `type:
    'article'` + imagem de capa quando existe, canonical
    `/portfolio/${slug}`.
  - Layout: header em coluna de leitura (`category`, `h1`, `description`),
    `WorkGallery`, seção de comentários (`h2`, lista, `CommentForm`).
  - Comentários: `getWorkComments(work.id)` em `try/catch`; erro →
    `ErrorToast` + estado vazio. Datas `en-US`/UTC em `<time>`. Conteúdo
    renderizado como texto (teste de XSS).
  - Copy em pt-BR.
- `comment-form.tsx` (Client): RHF + Zod (`min(1)` — diverge do contrato),
  `createComment`, sucesso via `<output>`, erro `role="alert"`; pt-BR.
- `error.tsx` (Client): pt-BR, estilo genérico, fora do sistema público.
- Sem `loading.tsx`/`not-found.tsx` no segmento; `notFound()` cai em
  `app/not-found.tsx` (raiz, sem estilo, pt-BR, fora do shell público —
  **não será alterado** nesta task).
- Testes: `page.test.tsx`, `comment-form.test.tsx`, `error.test.tsx`
  (asserts em pt-BR).

### Galeria (`components/gallery/`)

- `work-gallery.tsx` (Client): grid uniforme 2/3/4 colunas de miniaturas
  **quadradas**, cada uma `button` que abre o lightbox; capa repetida entre
  as miniaturas; sem hierarquia. Usado **apenas** em Project Details.
- `gallery-lightbox.tsx` (Client): Radix Dialog + Framer Motion, navegação
  circular, foco restaurado, `object-contain`, `sizes="100vw"`; pt-BR; sem
  tratamento de `prefers-reduced-motion`.
- `work-image-thumb.tsx` (Server): compartilhado com Home e admin
  (`trabalhos/_components/work-image-grid.tsx`) — mudanças só aditivas.

### Cache e invalidação

- `getWorks()`: `revalidate: 3600`, `tags: ['works']`, retry/backoff
  (`withRetryBackoff`: repete rede/timeout, 5xx e 429; **não** repete
  outros 4xx), timeout 10s.
- Admin invalida via Server Action `revalidateWorksTag()` →
  `updateTag('works')` (`app/(admin)/admin/actions.ts`); comentários via
  `workCommentsTag(workId)`.

## Contrato real (backend `docs/api-contract.md`)

- `GET /works/{slug}`: público; path param `slug`; `200` → um
  `WorkResponse`; `404` quando não existe, é rascunho ou foi removido
  logicamente; `429` rate limit global. Erros no formato
  `{ "message": string, "details"?: ... }`.
- `WorkResponse` = tipo `Work` atual (`id, slug, title, description,
  category, tags[], images[], status, createdAt, updatedAt, deletedAt`);
  `WorkImage` = `id, url, publicId, alt, isCover, order, createdAt,
  updatedAt`. **Nenhum campo de before/after**, dimensões, focal point,
  legenda ou tipo de imagem.
- Comentários: `GET /works/{workId}/comments` (aprovados) e
  `POST /works/{workId}/comments` (`authorName` 2–80, `content` 3–1000,
  cria `PENDING`).

Consequências:

- **Before/after NÃO será implementado** (DoD 4 satisfeito pela ausência de
  pares reais); inferir por `order`/`alt`/URL seria inventar dados.
  Dependência futura: campo explícito no backend.
- Hierarquia só por `isCover` e `order`; proporções atribuídas pela
  **posição no layout**, não por suposição de conteúdo; `object-position`
  central (limitação conhecida, sem focal point).
- `alt`: `image.alt || work.title`.

## Migração para `GET /works/{slug}`

- `lib/api/works.ts` → `getWorkBySlug(slug): Promise<Work | undefined>`
  (assinatura preservada):
  - `fetch(\`${apiUrl}/works/${encodeURIComponent(slug)}\`)` com `next: {
    revalidate: WORKS_REVALIDATE_SECONDS, tags: ['works'] }` — mantém a tag
    `works` para que `revalidateWorksTag()` (admin) continue invalidando o
    detalhe (coerência de revalidação); timeout via `AbortController` como
    em `getWorks()`.
  - Retry via `withRetryBackoff` (default já não repete 404).
  - `404` → retorna `undefined` → página/`generateMetadata` chamam
    `notFound()`.
  - Demais `!response.ok` (5xx, 429 após retries, outros 4xx) e falhas de
    rede → lança `HttpError` → `[slug]/error.tsx`. Sem `try/catch` na
    página que engula esses erros.
  - Sem casts inseguros além do padrão já existente para o JSON tipado.
- `generateMetadata` e a página chamam `getWorkBySlug` no mesmo render; o
  Data Cache/memoização do `fetch` evita chamada duplicada (validar no
  build).
- `generateStaticParams()` e `app/sitemap.ts` **continuam** usando
  `getWorks()` (`GET /works`).
- `getCoverImage` inalterado; nenhuma outra função de `lib/api/*` muda.
- `lib/api/works.test.ts`: substituir testes do filtro por testes de URL
  (slug codificado), opções de cache/tag, `200` → `Work`, `404` →
  `undefined` sem retry, `5xx` → retry e `HttpError`.
- `docs/rules/rendering.md`: corrigir a linha de Project Details (hoje
  afirma que o backend não expõe `GET /works/:slug`) para descrever o
  consumo de `GET /works/{slug}` com `revalidate` 3600s + tag `works`,
  `404` → `notFound()`, `generateStaticParams` via `GET /works`, e o
  registro de que não há `loading.tsx` no segmento (soft-404). Atualizar
  também o comentário de `getWorkBySlug` em `lib/api/works.ts`.

## Padrões herdados (CARSHOP-145 e notas do knowledge-reader)

- Composição por **função pura de layout** que atribui papéis às imagens
  (ex.: cover/lead, supporting, detail, solo), testada unitariamente para
  0..N imagens; ordem do DOM = ordem de `order`; **sem CSS `order`**.
- `sizes` **fixos por papel/breakpoint**; `priority`/preload **somente**
  na imagem LCP (capa); demais lazy; contêineres com aspect-ratio fixo
  (sem CLS). Conjunto de proporções 16:9/4:3/3:4; quadrado não é padrão.
- `priority` do `next/image` está deprecado no Next 16 em favor de
  `preload`: o `architect` decide qual usar conforme a versão instalada
  (`next@^16`), sem introduzir regressão em `WorkImageThumb` (compartilhado
  com Home e admin — mudança só aditiva, ou follow-up).
- **Sem placeholder** para imagens ausentes: work sem imagens vira página
  tipográfica.
- **Sem retry inline** em erro de dados cacheado por ISR; retry apenas no
  `error.tsx` (`reset()`), mais link de retorno.
- Estados reutilizam o padrão visual da 145 (bloco à esquerda, `h2`
  `text-heading-3`, `p` `text-body text-secondary-foreground`, link com
  `LuArrowRight`, alvos ≥ 44px); reuso/extração de
  `PortfolioStateMessage`/`BackToHomeLink` é decisão do `architect`, sem
  mudar `/portfolio`.
- **Comentários públicos não são testimonials**: não promovê-los a
  depoimentos, citações em destaque, estrelas, carrosséis ou prova social;
  apresentação sóbria, subordinada à narrativa (DoD 5).
- `category` e demais dados como vêm da API; nenhuma informação de negócio
  inventada; `cn` de `@/lib/utils`.

## Escopo

- `lib/api/works.ts` (`getWorkBySlug`) + testes, conforme a migração.
- Refatorar `app/(public)/portfolio/[slug]/page.tsx`: Server Component,
  `generateStaticParams`/`generateMetadata` (estrutura de title,
  description, OG `article` + capa, canonical preservada), `notFound()`
  e ISR mantidos.
- Narrativa: header do projeto (`category`, `h1`, `description`, `tags`
  opcional — decisão do `architect`), capa dominante, sequência editorial
  das demais imagens por `order`, composição previsível para 0, 1, 2,
  ímpar e N imagens, leitura linear no mobile; link de retorno para
  `/portfolio`.
- Galeria editorial (novo componente da rota ou evolução de
  `WorkGallery` — decisão do `architect`), com lightbox acessível mantido.
- Comentários e formulário integrados e subordinados; preservar ISR/tag de
  comentários, toast em erro, texto puro (XSS), `<time dateTime>`, fluxo
  `PENDING`. Schema do `CommentForm` alinhado ao contrato.
- `error.tsx` no sistema visual público ("Try again" + link de retorno);
  `not-found.tsx` novo do segmento; toda a copy em inglês.
- Atualização de `docs/rules/rendering.md` (e comentário em
  `lib/api/works.ts`).
- Testes: `lib/api/works.test.ts`, `page.test.tsx`, `error.test.tsx`,
  `comment-form.test.tsx`, `work-gallery.test.tsx`,
  `gallery-lightbox.test.tsx`, `not-found` e função de layout novos.

## Fora de escopo

- Alterar o contrato da API/backend; alterar `getWorks()`,
  `getCoverImage`, `lib/api/comments*`, `lib/api/auth.client.ts`
  (mensagens de `getApiErrorMessage` permanecem como estão).
- Reabrir CARSHOP-25/116.
- Before/after; novos campos no backend (apenas registrar dependência).
- `loading.tsx` em qualquer nível de `app/(public)/portfolio/`.
- `app/not-found.tsx` raiz, `/portfolio` (listagem), Home, Header/Footer,
  admin, `sitemap.ts`; mudanças não aditivas em `WorkImageThumb`.
- Related Projects, compartilhamento social, paginação/moderação de
  comentários, apresentação de comentários como testimonials.
- Imagens de concorrentes/referências, stock ou IA como conteúdo.

## Critérios de aceite (derivados do DoD)

1. Página consome `GET /works/{slug}` via `getWorkBySlug` (tag `works`,
   revalidate 3600s); `404` → `notFound()`; demais erros → `error.tsx`;
   `generateStaticParams`/sitemap via `GET /works`; metadata sem
   regressão; nenhum dado inventado; `rendering.md` atualizado.
2. Fotografia real domina: capa como imagem principal, demais em
   composição editorial (não grid uniforme de miniaturas quadradas).
3. Hierarquia capa → secundárias clara; proporções 16:9/4:3/3:4 por papel;
   quadrado não é padrão.
4. Nenhum before/after renderizado.
5. Comentários (lista, vazio, erro) e formulário funcionais, subordinados à
   narrativa, sem tratamento de testimonial; validação 2–80/3–1000 + recusa
   de HTML; XSS e fluxo `PENDING` preservados.
6. `error.tsx` e `not-found.tsx` no sistema visual público, em inglês; sem
   `loading.tsx`; slug desconhecido retorna **HTTP 404** em `next build &&
   next start`; erro de comentários não derruba a página.
7. `next/image` com `sizes` fixos por papel, `priority`/`preload` só no
   LCP, lazy nas demais, sem CLS, alt com fallback; lightbox acessível
   (teclado, Esc, foco, labels em inglês) e `motion-reduce` respeitado.
8. Mobile/tablet/desktop verificados no dev server; um único `h1`,
   headings hierárquicos, foco visível, alvos ≥ 44px, contraste WCAG;
   `lint`, `typecheck`, `build` e testes passam (incluindo Home,
   `/portfolio` e admin se componentes compartilhados forem tocados);
   cobertura ≥ 80% no código novo/alterado.

## Riscos

- Mudança de fonte de dados: rate limit global (100 req/15 min por IP)
  afeta mais chamadas por slug em builds/revalidações; mitigado pelo cache
  ISR. Slug com caracteres especiais exige `encodeURIComponent`.
- Tratar 404 como erro (ou erro como 404) mudaria semântica: testes devem
  cobrir ambos os caminhos.
- Soft-404 se qualquer loading/Suspense boundary for introduzido acima de
  `notFound()` (lição da 145).
- Crop cego (sem dimensões/focal point); lightbox com `object-contain` é a
  visão íntegra.
- `WorkImageThumb` compartilhado com Home e admin; deprecação de
  `priority` no Next 16.
- Mudança de copy quebra asserts pt-BR em vários testes.

## Classificação de tamanho

**NON-TRIVIAL** — redesenho de página inteira com decisões de UI e
arquitetura (composição/papéis da galeria, LCP/`sizes`, boundaries
Server/Client da galeria e lightbox, `not-found` de segmento), mais a
migração de consumo para `GET /works/{slug}` com estratégia de cache/erros,
em múltiplos arquivos e camadas. Plano persistido obrigatório.

## Próximos agentes

- `knowledge-reader`: concluído (notas incorporadas acima).
- `architect`: obrigatório — composição e papéis, frames/`sizes`,
  `priority` vs `preload`, galeria/lightbox, estados, reuso de componentes
  da 145, detalhes de `getWorkBySlug`.
- `plan-writer`: obrigatório.
