# Plano de implementação — CARSHOP-146

Consolida `specs/CARSHOP-146/spec.md` (NON-TRIVIAL), as decisões validadas
pelo usuário (endpoint, idioma, 404 sem `loading.tsx`, schema do
`CommentForm`, lightbox mantido) e o registro de decisão do `architect`
(D1–D10), aceito pelo orquestrador. Este plano **não** introduz nenhuma
decisão nova de arquitetura ou design — apenas sequencia a implementação.

Branch: `feat/CARSHOP-146`, a partir de `master` (já contém a CARSHOP-145,
`f60de68`). Sem Figma aprovado: fonte visual autoritativa é `docs/design/*`.
Versão instalada: `next@16.3.4`.

## Decisões aprovadas (entrada deste plano)

### Usuário

1. **Endpoint**: `getWorkBySlug` passa a consumir `GET /works/{slug}`
   (CARSHOP-117). Muda só o consumo em `lib/api/works.ts`; contrato da API
   inalterado.
2. **Idioma**: inglês em toda a copy da página, galeria, lightbox,
   comentários, formulário e estados de erro/404. Dados da API intactos.
3. **404**: novo `app/(public)/portfolio/[slug]/not-found.tsx` no sistema
   visual público; **nenhum** `loading.tsx` em `app/(public)/portfolio/`;
   HTTP 404 real validado com `next build && next start`.
4. **CommentForm**: schema alinhado ao contrato (`authorName` 2–80,
   `content` 3–1000, com `trim`), mantendo o `refine` anti-HTML; mensagens
   em inglês.
5. **Lightbox mantido**: `object-contain`, copy em inglês,
   `prefers-reduced-motion` respeitado.

### Architect (essencial)

- **Achados técnicos (Next 16.3.4)**: `priority` do `next/image` está
  deprecado, `preload` é o equivalente e passar os dois lança erro; o Data
  Cache armazena só respostas `200` (404 nunca é cacheado); a memoização do
  `fetch` é desativada quando há `signal` → deduplicação por `React.cache()`;
  `error.tsx` recebe `retry` (estável desde 16.3.0) → usar `retry`.
- **Server vs Client**: página continua Server Component `async`. Clients
  apenas `ProjectGallery`, `GalleryLightbox`, `CommentForm`, `ErrorToast` e
  `[slug]/error.tsx`. `ProjectComments`, `BackToPortfolioLink` e
  `not-found.tsx` são Server.
- **Galeria**: `WorkGallery` é **removido** e substituído por
  `ProjectGallery` (rota) + função pura `buildProjectGallery`.
- **Não exibir**: tags, `createdAt`/`updatedAt`, before/after.
- **Conflitos resolvidos por recomendação (aceitos)**: erro do
  `CommentForm` com mensagem local em inglês (sem `getApiErrorMessage`);
  crop central + lightbox `contain` (sem focal point); dedupe via
  `React.cache`; `[slug]/error.tsx` usa `retry` (a `/portfolio/error.tsx`
  fica como follow-up); tags não exibidas.

## Bloqueios

Nenhum bloqueio impeditivo identificado pelo `architect`. Pré-requisito
operacional para a validação de HTTP 404 real e da verificação visual:
**backend local rodando** com dados publicados. Se o backend não estiver
disponível, reportar ao usuário em vez de simular a validação.

## Arquivos

### Criar

1. `app/(public)/portfolio/[slug]/_lib/build-project-gallery.ts`
2. `app/(public)/portfolio/[slug]/_lib/build-project-gallery.test.ts`
3. `app/(public)/portfolio/[slug]/_components/project-gallery.tsx`
   (`'use client'`)
4. `app/(public)/portfolio/[slug]/_components/project-gallery.test.tsx`
5. `app/(public)/portfolio/[slug]/_components/project-comments.tsx` (Server)
6. `app/(public)/portfolio/[slug]/_components/back-to-portfolio-link.tsx`
   (sem `'use client'`)
7. `app/(public)/portfolio/[slug]/not-found.tsx` (Server)
8. `app/(public)/portfolio/[slug]/not-found.test.tsx`

### Modificar

9. `lib/api/works.ts` (`getWorkBySlug` + JSDoc)
10. `lib/api/works.test.ts`
11. `app/(public)/portfolio/[slug]/page.tsx`
12. `app/(public)/portfolio/[slug]/page.test.tsx`
13. `app/(public)/portfolio/[slug]/comment-form.tsx`
14. `app/(public)/portfolio/[slug]/comment-form.test.tsx`
15. `app/(public)/portfolio/[slug]/error.tsx`
16. `app/(public)/portfolio/[slug]/error.test.tsx`
17. `components/gallery/gallery-lightbox.tsx` (+ `gallery-lightbox.test.tsx`)
18. `components/gallery/work-image-thumb.tsx` (+ teste) — **aditivo**:
    `preload?: boolean`
19. `app/(public)/portfolio/_components/portfolio-state-message.tsx` —
    **aditivo**: `headingLevel?: 1 | 2`
20. `app/(public)/portfolio/error-boundary.test-helpers.tsx` — **aditivo**:
    `recoveryProp?: 'reset' | 'retry'`
21. `docs/rules/rendering.md` (linha de Project Details)

### Remover

22. `components/gallery/work-gallery.tsx` e seu teste (confirmar via grep que
    não restam imports).

### Não alterar (validar que continuam passando)

`getWorks()`, `getCoverImage`, `lib/api/comments*`, `lib/api/auth.client.ts`
(`getApiErrorMessage`), `app/not-found.tsx` (raiz), `app/(public)/portfolio/page.tsx`
e `error.tsx` da listagem, Home, Header/Footer, admin, `app/sitemap.ts`,
`components/ui/dialog.tsx` e demais `components/ui/*`,
`resolve-preview-image.ts`.

## Sequência de implementação

### 1. Camada de dados — `lib/api/works.ts` (D1)

- `export const getWorkBySlug = cache(async (slug: string): Promise<Work | undefined> => …)`
  com `cache` importado de `react` (deduplica `generateMetadata` + página
  no mesmo request). Assinatura de retorno preservada.
- Dentro de `withRetryBackoff` (config default), mesmo padrão
  `AbortController` + timeout de `getWorks()`:
  `fetch(\`${serverEnv.apiUrl}/works/${encodeURIComponent(slug)}\`, { signal, next: { revalidate: WORKS_REVALIDATE_SECONDS, tags: ['works'] } })`.
  - `404` → `return undefined` (sem throw, sem retry).
  - Demais `!response.ok` → `throw new HttpError(\`Failed to fetch work "${slug}": ${status}\`, status)`
    (5xx/429 repetidos pelo helper; outros 4xx não).
  - `return (await response.json()) as Work` (padrão de cast já existente);
    `clearTimeout` no `finally`.
- Atualizar o JSDoc (remover a menção ao filtro sobre `GET /works`).
- `getWorks()`, `getCoverImage` e `generateStaticParams`/sitemap intactos.

### 2. Componentes compartilhados — mudanças aditivas

- `work-image-thumb.tsx`: nova prop `preload?: boolean` (default `false`)
  repassada ao `<Image preload>`. Comportamento de `priority` inalterado para
  Home, `/portfolio` e admin. **Nunca** passar `priority` e `preload` juntos.
- `portfolio-state-message.tsx`: `headingLevel?: 1 | 2` (default `2`);
  `1` → `h1` com `text-heading-1`. `/portfolio` não muda.
- `error-boundary.test-helpers.tsx`: `recoveryProp?: 'reset' | 'retry'`
  (default `'reset'`); mockar ambos e verificar o escolhido.

### 3. Função de layout — `_lib/build-project-gallery.ts` (D4)

- Tipos exportados: `ProjectGalleryRole = 'wide' | 'narrow' | 'solo'`,
  `ProjectGalleryEntry = { image; role; viewerIndex }`,
  `ProjectGalleryLayout = { hero: WorkImage | null; entries; viewerImages }`;
  `buildProjectGallery(work: Work): ProjectGalleryLayout`.
- `hero = resolvePreviewImage(work)` (reuso de
  `app/(public)/portfolio/_lib/resolve-preview-image`).
- `rest`: demais imagens excluindo o hero por `id`, ordenadas por `order`
  com sort estável sobre cópia (sem mutar a entrada; capa não repetida).
- `viewerImages = hero ? [hero, ...rest] : []`; hero `viewerIndex` 0,
  `rest[i]` → `i + 1`.
- Papéis: pares alternam — par par `[wide, narrow]`, par ímpar
  `[narrow, wide]`; último sem par → `solo`.
- Referência: 0 → sem hero, sem galeria; 1 → só hero; 2 → hero + solo;
  3 → hero + wide + narrow; 4 → + solo; 5 → hero + wide + narrow + narrow +
  wide; N → ciclo.

### 4. Galeria — `_components/project-gallery.tsx` (D5)

- `'use client'`; recebe `layout` (serializável) e `fallbackAlt`; mantém
  `selectedIndex` e `lastTriggerRef`; compõe `GalleryLightbox` com
  `viewerImages`.
- Constantes de `sizes` por papel no próprio arquivo:

  | papel | frame (`WorkImageThumb`) | span | `sizes` |
  | --- | --- | --- | --- |
  | hero | `aspect-4/3 md:aspect-video` | container inteiro | `(min-width: 1280px) 1120px, (min-width: 1024px) calc(100vw - 128px), (min-width: 640px) calc(100vw - 64px), 100vw` |
  | wide | `aspect-4/3` | `lg:col-span-7` | `(min-width: 1280px) 640px, (min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw` |
  | narrow | `aspect-4/3 lg:aspect-3/4` | `lg:col-span-5` | `(min-width: 1280px) 448px, (min-width: 1024px) 42vw, (min-width: 768px) 50vw, 100vw` |
  | solo | `aspect-4/3` | `md:col-span-2 lg:col-span-8` | `(min-width: 1280px) 736px, (min-width: 1024px) 66vw, 100vw` |

- Wrapper hero + grid: `flex flex-col gap-4 md:gap-6 lg:gap-8`. Hero em
  `<div>` (contido, não full-bleed); sequência em `<ul>`/`<li>` com
  `grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-12 lg:gap-8`.
- Sem frames quadrados; `object-cover` centralizado. `preload` **somente**
  no hero; demais lazy (default).
- Cada imagem dentro de `<button type="button">` com
  `aria-label={\`View image ${viewerIndex + 1} of ${total}: ${alt}\`}` e
  classes `group block w-full cursor-zoom-in rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50`;
  wrapper `overflow-hidden rounded-lg`; imagem
  `transition-transform duration-300 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none`.
- `alt = image.alt || fallbackAlt` em todos os pontos.

### 5. Lightbox — `components/gallery/gallery-lightbox.tsx` (D6)

- Copy em inglês: título `sr-only` `Image ${i + 1} of ${n}: ${alt}`;
  "Previous image" / "Next image"; manter o contador `aria-live`.
- `DialogContent showCloseButton={false}` + botão próprio `DialogClose asChild`
  `size-11` com `aria-label="Close"`.
- Setas `size-11`; `sm:max-w-5xl`; frame `aspect-3/4 sm:aspect-video`,
  limitado à altura disponível do viewport; conteúdo com `max-height` em
  `dvh` e rolagem de segurança; `object-contain`,
  `sizes="(min-width: 1088px) 1024px, calc(100vw - 2rem)"`. Imagem do
  lightbox só monta quando aberto.
- Reduced motion: `useReducedMotion()` do `framer-motion` →
  `transition={{ duration: 0 }}`; `DialogContent` com
  `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`;
  `DialogOverlay` compartilhado recebe as mesmas variantes de forma aditiva.
- Foco: manter `restoreFocusRef`; ao fechar, foco volta ao botão de origem
  mesmo após navegar. Focus trap, Esc e ←/→ inalterados. Sem setas com 1
  imagem.

### 6. Comentários — `project-comments.tsx` e `comment-form.tsx` (D7)

`ProjectComments` (Server; props `workId`, `comments`, `failed: boolean`):

- `h2#comments-heading` "Comments" (`text-heading-3`). Sem aspas, estrelas
  ou contagem (não é testimonial).
- Lista `ul divide-y divide-border`; cada item: `authorName`
  (`text-body font-medium text-foreground`) + `<time dateTime>`
  (`text-body-sm text-muted-foreground`, formatter en-US/UTC existente);
  `content` (`text-body text-secondary-foreground whitespace-pre-line`) como
  texto puro.
- Vazio: "No comments yet."
- Erro: `ErrorToast` + `p` inline "We couldn't load comments right now.
  Please try again later." **no lugar** da mensagem de vazio; formulário
  continua disponível.
- Bloco do formulário `mt-12`: `h3` "Leave a comment" (`text-heading-4`),
  `p` "Comments are reviewed before they appear on this page."
  (`text-body-sm text-muted-foreground`), `CommentForm`.

`CommentForm` (Client):

- `authorName`: `.trim().min(2, "Please enter your name (at least 2 characters).").max(80, "Name must be 80 characters or fewer.")` + refine anti-HTML.
- `content`: `.trim().min(3, "Please write a comment (at least 3 characters).").max(1000, "Comment must be 1,000 characters or fewer.")` + refine anti-HTML.
- `NO_HTML_MESSAGE`: "HTML and scripts are not allowed."
- Sem atributo HTML `maxLength`. Payload com valores trimados e apenas as
  duas chaves.
- Labels "Name", "Comment"; botão "Send comment" / "Sending…"; sucesso em
  `<output>`: "Thanks — your comment was sent and will appear here once
  it's approved."; erro `role="alert"` com mensagem local fixa "We couldn't
  send your comment. Please try again." (parar de usar `getApiErrorMessage`
  neste formulário, sem alterar a função).
- `Input className="h-11"`, textarea `min-h-32`,
  `Button variant="outline" size="lg" className="h-11 w-fit px-6"`.
- Erros de campo com `aria-describedby` + `aria-invalid`. Fluxo `PENDING`
  sem inserção otimista.

### 7. Link de retorno — `_components/back-to-portfolio-link.tsx`

- `Link href="/portfolio"` "Back to portfolio", `LuArrowLeft` (`aria-hidden`)
  antes do texto, mesmas classes do `BackToHomeLink` (`min-h-11`,
  `text-nav`, foco `ring-3`).

### 8. Página — `app/(public)/portfolio/[slug]/page.tsx` (D2, D3)

- Continua Server Component `async`; `generateStaticParams` via
  `getWorks()` com fallback `[]`; `generateMetadata` com a mesma estrutura
  (title `${title} — CarShop`, `description`, OG `type: 'article'` + capa
  com `alt: cover.alt || work.title`, canonical `/portfolio/${slug}`).
- `getWorkBySlug` **sem** `try/catch` (erros propagam para `error.tsx`);
  `undefined` → `notFound()`. Apenas `getWorkComments(work.id)` em
  `try/catch` → `failed`.
- `buildProjectGallery(work)` no servidor → `ProjectGallery` com `layout` e
  `fallbackAlt={work.title}`.
- Composição (ordem do DOM = ordem visual; sem CSS `order`):
  1. `PageSection spacing="compact" container="page"` →
     `<article aria-labelledby="project-title">`:
     - `BackToPortfolioLink` no topo;
     - `<header className="mt-8 lg:mt-12 flex max-w-4xl flex-col">`:
       `category` (`text-label text-muted-foreground`), `h1#project-title`
       (`mt-3 text-display-lg text-foreground`), `description`
       (`mt-6 max-w-2xl text-body-lg text-secondary-foreground whitespace-pre-line`);
       alinhado à esquerda (não `container="reading"`);
     - se `layout.hero`: `<section aria-labelledby="project-photos-heading" className="mt-10 lg:mt-16">`
       com `h2#project-photos-heading.sr-only` "Project photos" +
       `ProjectGallery`.
  2. Fora do `article`: `PageSection as="section" spacing="standard" container="page" aria-labelledby="comments-heading"`
     → `div.border-t.border-border.pt-10.lg:pt-12` → `div.max-w-2xl` →
     `ProjectComments`.
- Sem tags, sem datas do work, sem before/after. Sem `loading.tsx`,
  `Suspense` ou `dynamicParams`.

### 9. Estados — `not-found.tsx` e `error.tsx` (D8)

- `not-found.tsx` (Server): `PageSection spacing="compact"` →
  `PortfolioStateMessage headingLevel={1}` title "Project not found",
  message "This project doesn't exist or is no longer published.", com
  `BackToPortfolioLink` como filho.
- `error.tsx` (`'use client'`): props `{ error, retry }`; `useEffect` com
  `toast.error(PROJECT_ERROR_MESSAGE)` + `console.error(error)`;
  `PortfolioStateMessage headingLevel={1}` title "We couldn't load this
  project", message `PROJECT_ERROR_MESSAGE`; `Button size="lg" className="h-11 px-6"`
  "Try again" → `retry()`; `BackToPortfolioLink`.
  `PROJECT_ERROR_MESSAGE = "We couldn't load this project right now. Please try again in a few moments."`
  (constante local, não exportada).
- `app/not-found.tsx` raiz inalterado.

### 10. Remoção de `WorkGallery`

- Apagar `components/gallery/work-gallery.tsx` e o teste; grep por
  `work-gallery`/`WorkGallery` para garantir zero referências.

### 11. Documentação — `docs/rules/rendering.md`

Substituir a linha de Project Details (que hoje afirma não existir
`GET /works/:slug`) pelo conteúdo decidido: ISR; `generateStaticParams` via
`getWorks()` (`GET /works`); página + `generateMetadata` via
`getWorkBySlug` → `GET /works/{slug}` (revalidate 3600, tag `works`,
retry + timeout, dedupe por request via `React.cache`); `404` → `undefined`
→ `notFound()` → `not-found.tsx` do segmento (HTTP 404; Next não armazena
404 no Data Cache); demais erros → `error.tsx` com `retry()`; sem
`loading.tsx`/`Suspense` no segmento ou acima (soft-404); Server Component;
clients apenas `ProjectGallery`, `GalleryLightbox`, `CommentForm`,
`ErrorToast` e `error.tsx`.

## Plano de testes

Padrão: Vitest + Testing Library, `vi.mock('server-only')`, Server Components
testados com `await`. Slugs distintos por teste onde `React.cache` puder
interferir.

### `lib/api/works.test.ts`

Substituir os dois testes do filtro por:

- URL codificada (`'a b/c'` → `/works/a%20b%2Fc`);
- opções `next: { revalidate, tags: ['works'] }` e `signal` do tipo
  `AbortSignal`;
- `200` → `Work`;
- `404` → `undefined`, exatamente 1 chamada, `vi.getTimerCount() === 0`;
- `503` depois `200` → 2 chamadas, retorna `Work`;
- `500` persistente → `HttpError` após os retries (fake timers);
- `400` → lança sem retry;
- erro de rede → repetido.

### Unitários da rota

- `build-project-gallery.test.ts`: 0, 1, 2, 3, 4, 5 e N imagens; sem
  `isCover` → hero de menor `order`; capa com `order` 3 excluída do meio;
  `order` duplicado estável; mapeamento de `viewerIndex`; entrada não
  mutada.
- `project-gallery.test.tsx`: hero sem `loading="lazy"`, demais lazy;
  labels e ordem; clique abre o dialog com o título correto; setas e
  navegação por teclado; fechar devolve o foco ao botão de origem; sem
  setas com 1 imagem; classes de frame por papel.

### Compartilhados

- `gallery-lightbox.test.tsx`: copy em inglês, close com 44px,
  `useReducedMotion` mockado.
- `work-image-thumb.test.tsx`: `preload` repassado; default inalterado.

### Página e estados

- `page.test.tsx` (em inglês): um único `h1`; hero presente/ausente (0
  imagens → sem seção de fotos); tags não renderizadas; erro de
  `getWorkBySlug` propaga (página rejeita); `undefined` → `notFound`;
  metadata (title, OG `article` + fallback do alt da capa, canonical);
  comentários lista/vazio/erro (toast + inline, sem mensagem de vazio); XSS
  como texto; `<time dateTime>`.
- `comment-form.test.tsx`: limites nome 1/2 e 80/81; conteúdo 2/3 e
  1000/1001; whitespace trimado antes da validação (`"  a "` falha no
  `min`); payload trimado com apenas duas chaves; HTML rejeitado; sucesso
  em `<output>`; mensagem local de erro.
- `error.test.tsx`: helper com `recoveryProp: 'retry'`, textos em inglês.
- `not-found.test.tsx`: `h1`, mensagem, link para `/portfolio`.

### Regressão e qualidade

- Suítes de Home, `/portfolio` (incluindo `portfolio/error.test.tsx` com o
  helper no default `'reset'`) e admin (`work-image-grid`) passando.
- Cobertura ≥ 80% no código novo/alterado.
- `lint`, `typecheck`, `test` e `build` passando. Nenhum `any`, `as any`,
  `@ts-ignore`, `@ts-expect-error` ou cast inseguro além do padrão já
  existente para o JSON tipado.

## Validação em runtime

### HTTP 404 real (produção local, backend rodando)

- `next build` e `next start -p 3146` (porta própria; encerrar **apenas o
  próprio PID** ao final — nunca `pkill "next dev"` nem derrubar o dev
  server do usuário).
- `curl -s -o /dev/null -w "%{http_code}"` em `/portfolio/slug-inexistente`
  **duas vezes** → `404` em ambas; HTML contém "Project not found" dentro do
  shell público.
- Slug real → `200`; `/portfolio/a%20b` → `404`.
- Conferir nos logs do backend: 1 `GET /works/{slug}` por render (dedupe
  entre `generateMetadata` e página).

### Dev server (verificação visual)

Subir um dev server em porta própria (sem matar o do usuário) e validar
`/portfolio/[slug]`:

- **Mobile (~375px)**: leitura linear; hero 4:3; todas as imagens 4:3 em
  coluna única, gap 16px; sem overflow horizontal.
- **Tablet (`md`)**: hero 16:9; pares em 2 colunas 4:3, gap 24px; solo
  ocupa 2 colunas.
- **Desktop (`lg`+, ~1280px)**: hero 16:9 (1120px em `xl`); 12 colunas com
  alternância 7/5 ↔ 5/7, narrow 3:4, `items-start`, gap 32px; solo em 8
  colunas à esquerda; comentários `max-w-2xl` à esquerda, `border-top` na
  largura do container.
- Casos com 0/1/2/3/N imagens, se houver dados reais.
- **DevTools**: larguras renderizadas vs. `sizes`; apenas o hero com
  preload/`fetchpriority="high"`; sem CLS.
- **Lightbox**: operação completa por teclado (abrir, ←/→, Esc, foco de
  volta ao botão de origem); com `prefers-reduced-motion` emulado, animação
  computada `none` no `DialogContent`.
- **A11y**: um único `h1`; `h2` sr-only "Project photos" → `h2` "Comments"
  → `h3` "Leave a comment"; erro/404 só com `h1`; foco visível `ring-3`;
  alvos ≥ 44px; contraste WCAG.
- **Estados**: slug inexistente → 404 público; API de comentários
  indisponível → toast + mensagem inline sem derrubar a página.

## Critérios de aceite mapeados ao DoD

| Critério (resumo) | Como o plano atende |
| --- | --- |
| 1. `GET /works/{slug}`, 404 → `notFound`, erros → `error.tsx`, metadata sem regressão, `rendering.md` | Passos 1, 8 e 11; testes de `works.test.ts` e `page.test.tsx` |
| 2. Fotografia real domina, sem grid uniforme de quadrados | Hero dominante + sequência editorial (passos 3–4) |
| 3. Hierarquia capa → secundárias; 16:9/4:3/3:4 por papel | Papéis e frames de D4/D5 |
| 4. Nenhum before/after | Não implementado (dependência de backend) |
| 5. Comentários e formulário funcionais e subordinados; 2–80/3–1000 + anti-HTML; XSS e `PENDING` | Passo 6; testes de limites, trim, XSS |
| 6. `error.tsx`/`not-found.tsx` públicos em inglês; sem `loading.tsx`; HTTP 404 real | Passo 9; validação em `next start -p 3146` |
| 7. `sizes` fixos, `preload` só no LCP, lazy, sem CLS, alt com fallback; lightbox acessível e `motion-reduce` | Passos 2, 4 e 5; DevTools |
| 8. Responsivo, a11y, lint/typecheck/build/testes, cobertura ≥ 80% | Plano de testes + verificação no dev server |

## Riscos (registrados)

1. **Slugs desconhecidos sempre atingem o backend** (404 não é cacheado) —
   mitigado por `React.cache` por request; rate limit global de 100 req/15
   min por IP.
2. **Crop central cego** (sem focal point/dimensões) — lightbox `contain`
   é a visão íntegra.
3. **Especificidade de `motion-reduce`** sobre as animações do
   `DialogContent` e `DialogOverlay` — verificar no DevTools.
4. **Remoção de `WorkGallery`** — grep obrigatório por referências.
5. **Mudanças aditivas** em `WorkImageThumb`, `PortfolioStateMessage` e no
   helper de teste — defaults preservam Home, `/portfolio` e admin.
6. **Asserts em pt-BR** em vários testes precisam ser atualizados.
7. **Soft-404**: qualquer `loading.tsx`/`Suspense` acima de `notFound()`
   reintroduz o problema (lição da CARSHOP-145).

## Follow-ups (fora de escopo — não implementar agora)

- Migração `priority` → `preload` em Home, `/portfolio` e admin.
- `/portfolio/error.tsx` migrar de `reset` para `retry`.
- Backend: campos de before/after, focal point, dimensões e legendas de
  imagem.
- Semântica pública para `tags`.

## Fora de escopo (reforço)

- Contrato da API/backend; `getWorks()`, `getCoverImage`,
  `lib/api/comments*`, `lib/api/auth.client.ts`.
- Reabrir CARSHOP-25/116.
- `loading.tsx` em qualquer nível de `app/(public)/portfolio/`.
- `app/not-found.tsx` raiz, listagem `/portfolio`, Home, Header/Footer,
  admin, `sitemap.ts`, `components/ui/dialog.tsx`.
- Related Projects, compartilhamento social, paginação/moderação de
  comentários, comentários como testimonials.
- Imagens de concorrentes/referências, stock ou IA como conteúdo.
