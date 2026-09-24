# Plano de implementação — CARSHOP-147

Consolida `specs/CARSHOP-147/spec.md` (NON-TRIVIAL), as decisões do usuário
sobre os Conflitos 1–5 e o registro de decisão do `architect` (autoritativo).
Este plano **não** introduz decisões novas de arquitetura ou design — apenas
sequencia a implementação.

Branch: `feat/CARSHOP-147`, baseada em `origin/master` `21675a4`, que já
contém a CARSHOP-146 mergeada (PR #37). Sem Figma aprovado: fonte visual
autoritativa é `docs/design/*`.

## Decisões aprovadas (entrada deste plano)

### Usuário

1. **Conteúdo híbrido**: só conteúdo confirmado; composição pronta para
   receber copy aprovada no futuro; **nenhum placeholder vazio visível**
   (sem lorem, sem "coming soon" genérico em blocos vazios).
2. **Services** lista categorias reais de trabalho vindas de `GET /works`
   via `getWorks()` → página passa a **ISR** (desvio do ADR-010 aprovado).
3. **About** também passa a **ISR** para exibir uma foto real (segundo
   desvio do ADR-010, aprovado).
4. **Contact** estático: links sociais do ambiente + CTAs; sem formulário,
   sem endpoint. Telefone/endereço/horário ficam pendentes.
5. Copy em **inglês**. Copy pt-BR do footer fica fora de escopo.

### Architect (resumo; detalhes nas seções abaixo)

- Inventário de rotas (DoD 1): `/` (ISR, 144), `/portfolio` (ISR, 145),
  `/portfolio/[slug]` (146), `/about`, `/services`, `/contact` (placeholders
  estáticos), redirect `/trabalhos` → `/portfolio` em `next.config.mjs`,
  metadata routes `sitemap`/`robots`/`icon`. **Nenhuma rota criada ou
  removida.**
- DoD 5 (formulários) **N/A** — não existe formulário de contato.
- Todas as páginas continuam Server Components; **nenhum** `'use client'`
  novo; sem `loading.tsx`, sem `Suspense`, sem `ErrorToast`.
- A interação de hover-image de serviços de `components.md` **não** é
  implementada nesta task.
- Ruído fora de escopo: `app/(public)/portfolio/node_modules/.vite/vitest/results.json`
  (follow-up; não tocar).

## Bloqueios

- **§0 do architect (dependência da 146 / prop `preload`) — RESOLVIDO.** A
  branch já está sobre `master` com a 146; `WorkImageThumb` expõe `preload`.
  Usar `preload` (nunca `priority`; passar os dois lança erro no Next 16).
- Pré-requisito operacional: backend local com works publicados para a
  validação visual de About/Services. Se indisponível, reportar ao usuário em
  vez de simular a validação (a degradação silenciosa deve ser validada
  também).

## Contratos

Tipos/localizações a confirmar pelo `developer` antes de codar:
shape real de `ServerEnv['social']` e local de `ProjectPreviewItem`.

```ts
// app/(public)/about/_lib/select-about-image.ts
selectAboutImage(works: readonly Work[]): ProjectPreviewItem | null
```
Primeiro work, na ordem da API, cujo `resolvePreviewImage(work) !== null`.
Pura, sem mutação.

```ts
// app/(public)/services/_lib/group-works-by-category.ts
type ServiceCategory = {
  key: string;
  label: string;
  works: Work[];
  preview: ProjectPreviewItem | null;
};
export const SERVICE_PROJECT_LINKS_LIMIT = 4;
groupWorksByCategory(works: readonly Work[]): ServiceCategory[]
```
- `key = label.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')`.
- `label` = primeira ocorrência, com `trim` + whitespace colapsado; exibida
  como está (sem uppercase).
- Sem stemming/sinônimos; acentos preservados.
- Categorias vazias/só whitespace são descartadas.
- Ordem = primeira aparição na ordem da API (sem ranking por contagem).
- `preview` = primeiro work do grupo com `resolvePreviewImage` não nulo.
- Sem atributo `lang` nos labels.

```ts
// lib/social-links.ts  (import 'server-only')
type SocialLink = { href: string; label: 'Instagram' | 'Facebook' | 'LinkedIn' };
getSocialLinks(social: ServerEnv['social'] = serverEnv.social): SocialLink[]
```

`resolvePreviewImage` é importado de
`app/(public)/portfolio/_lib/resolve-preview-image.ts` (não mover).

## Arquivos

### Criar

- `app/(public)/about/_lib/select-about-image.ts` (+ `.test.ts`)
- `app/(public)/services/_lib/group-works-by-category.ts` (+ `.test.ts`)
- `app/(public)/services/_components/service-category-row.tsx` (+ `.test.tsx`)
- `app/(public)/contact/_components/contact-follow-links.tsx` (+ `.test.tsx`;
  links recebidos via prop)
- `lib/social-links.ts` (+ `.test.ts`; `import 'server-only'`)

### Alterar

- `app/(public)/about/page.tsx` e `page.test.tsx`
- `app/(public)/services/page.tsx` e `page.test.tsx`
- `app/(public)/contact/page.tsx` e `page.test.tsx`
- `docs/rules/rendering.md`

### Reusar sem alterar

- `components/layout/page-section.tsx`, `components/layout/container.tsx`
- `components/gallery/work-image-thumb.tsx` (prop `preload`)
- `app/(public)/_components/home-cta-actions.tsx` (renomear para
  `PublicCtaActions` = follow-up, não nesta task)
- `app/(public)/portfolio/_lib/resolve-preview-image.ts`

### Não reusar

`FinalCta`, `HomeHero`, `ProjectPreview`.

### Não tocar

Header, Footer, `components/layout/nav-links.ts`, `app/sitemap.ts`,
`lib/api/*`, `lib/utils.ts`, `app/globals.css`, testes de Home/Portfolio/Footer.

## Copy permitida (inglês, somente já publicada)

- About: descrição da Home "Automotive upholstery, restoration and custom
  interior work."
- Services: tagline "Upholstery · Restoration · Custom Work".
- Contact: headline aprovada do Final CTA "Ready to transform your interior?".
- Microcopy de navegação: "View all projects", "See our services",
  "View our work", "Follow CarShop", "(opens in a new tab)",
  "Quote requests are coming soon. In the meantime, see our completed work."
- Proibido: números, telefone, endereço, horário, descrições de serviço,
  "Free", "Built to last" ou qualquer claim não confirmado.

## Ordem de implementação

### Passo 1 — Confirmar tipos e padrões existentes

Ler `ServerEnv` (shape de `social`), local de `ProjectPreviewItem`,
`resolvePreviewImage`, API de `WorkImageThumb` (`preload`, `sizes`,
aspect), `PageSection` (`spacing`, `container`), `Container` (`variant="page"`
e largura real de `container-page`), `HomeCtaActions`, o footer (como lê links
sociais hoje) e `app/(public)/page.test.tsx` (padrão de mocks
`server-only`/`@/lib/api/works` e `render(await Page())`).

### Passo 2 — Helpers puros (TDD)

1. `lib/social-links.ts` + teste: ordem e labels fixos, omite redes não
   configuradas, retorna `[]` sem nenhuma.
2. `select-about-image.ts` + teste: primeiro com imagem; `null` sem imagens
   ou lista vazia; não muta a entrada.
3. `group-works-by-category.ts` + teste: dedupe por `key` (case, espaços,
   NFC), label da primeira ocorrência, acentos preservados, descarte de
   vazias, ordem de primeira aparição, `preview` do primeiro com imagem,
   `null` quando nenhum tem imagem.

### Passo 3 — `/about` (Server Component async, ISR)

- `getWorks()` em `try/catch`; em falha `console.error` e fallback `[]`
  (degradação silenciosa → página só tipográfica). Revalidação ISR conforme
  padrão das outras páginas ISR públicas.
- Seção 1: `PageSection spacing="editorial" container="reading"`: `h1`
  "About CarShop" (`text-display-lg`) + `p text-body-lg
  text-secondary-foreground` com a descrição (ponto de inserção futuro da
  história aprovada, sem placeholder).
- Seção 2 (somente se `selectAboutImage` retornar item):
  `PageSection spacing="compact" container="none"` + `Container
  variant="page"`: `figure` com `WorkImageThumb` `aspect-4/3
  md:aspect-video`, `preload`, largura contida,
  `sizes="(min-width: 1280px) 1120px, 100vw"` (ajustar à largura real de
  `container-page`); `figcaption` com categoria (`text-label`) + link com o
  título do projeto → `/portfolio/[slug]` (`min-h-11`, `LuArrowRight`).
- Seção 3: `PageSection spacing="standard" container="reading"` com
  `border-t`: links de texto "See our services →" (`/services`) e
  "View our work →" (`/portfolio`), `min-h-11`.
- Sem `FinalCta`.

### Passo 4 — `ServiceCategoryRow` + `/services` (ISR)

- `ServiceCategoryRow` (Server): recebe `ServiceCategory`, índice e flag de
  `preload`. Em `lg`, grid de 12 colunas:
  - `col-span-1`: número "01" (`text-label text-muted-foreground`,
    `aria-hidden`);
  - `col-span-5`: `h2` com label (`text-heading-3`, como vem da API) +
    contagem real `text-body-sm` muted ("1 project" / "N projects") + `ul`
    com até `SERVICE_PROJECT_LINKS_LIMIT` links de título →
    `/portfolio/[slug]`, e "View all projects →" → `/portfolio` quando houver
    mais;
  - `col-span-6`: `WorkImageThumb` não interativa, `aspect-4/3`,
    alt `image.alt || work.title`,
    `sizes="(min-width: 1280px) 560px, (min-width: 1024px) 50vw, 100vw"`.
  - Sem foto → linha tipográfica (`col-span-5` vira `col-span-11`).
  - Ordem do DOM = ordem visual; sem CSS `order`, sem alternância.
  - Mobile: número + nome → foto 4:3 full width → lista de projetos.
- Página:
  1. `PageSection spacing="compact"`, header `max-w-3xl`: `h1` "Services"
     (`text-display-lg`) + `p text-body-lg` com a tagline.
  2. Se houver ≥ 1 categoria: `PageSection spacing="standard"` com
     `<ol role="list" className="border-t border-border divide-y divide-border">`,
     um `li` por `ServiceCategoryRow`. `preload` somente na imagem da
     primeira linha.
  3. Fechamento: `HomeCtaActions` em `PageSection spacing="standard"` com
     `border-t`, sem headline, sem `FinalCta`.
- `getWorks()` com a mesma degradação silenciosa do About (falha → sem
  lista, header + CTAs permanecem).

### Passo 5 — `ContactFollowLinks` + `/contact` (estático)

- `ContactFollowLinks` (Server, links via prop): `h2` "Follow CarShop"
  estilizado `text-heading-4`; `ul` de links externos `min-h-11`,
  `target="_blank"`, `rel="noreferrer"`, `span.sr-only` "(opens in a new
  tab)". Mobile `border-t pt-8`; `lg` `border-l pl-8`.
- Página: `PageSection spacing="editorial"`, grid 12 col em `lg`:
  - principal `lg:col-span-7`: eyebrow `span.text-label` "Contact" (único
    eyebrow das três páginas), `h1` "Ready to transform your interior?"
    (`text-display-lg`), `p text-body-lg` "Quote requests are coming soon.
    In the meantime, see our completed work.", `HomeCtaActions` ("Get a
    Quote" continua desabilitado).
  - lateral `lg:col-span-4 lg:col-start-9` somente se `getSocialLinks()`
    retornar itens. Sem links → principal vira `max-w-4xl`.
- Não renderizar telefone, endereço, horário ou e-mail.
- Atualizar o comentário do arquivo: formulário futuro = Client Component
  isolado; bloco `BusinessInfo` futuro quando houver dados confirmados.

### Passo 6 — Metadata (as três páginas)

Manter `title`, canonical absoluto via `NEXT_PUBLIC_SITE_URL` e estrutura
`openGraph`. Remover "under construction". Description como constante local
reutilizada no `openGraph`:

- About: "About CarShop — automotive upholstery, restoration and custom interior work."
- Services: "Upholstery · Restoration · Custom Work — services shown through real CarShop projects."
- Contact: "Contact CarShop about automotive upholstery, restoration and custom interior work."

### Passo 7 — Testes

Reescrever `about|services|contact/page.test.tsx` com
`vi.mock('server-only')` e `vi.mock('@/lib/api/works')` como em
`app/(public)/page.test.tsx`; `render(await Page())`.

- About: `h1`; foto + `figcaption` com link do projeto; sem `figure` quando
  `getWorks` rejeita ou não há imagens (`console.error` chamado na falha);
  links `/services` e `/portfolio`; metadata sem "construction".
- Services: `h1` + tagline; linhas = categorias deduplicadas; `h2` com label
  como está; limite de 4 links + "View all projects"; linha sem foto;
  degradação silenciosa; metadata.
- Contact: `h1`; "Get a Quote" desabilitado; sem `tel:`, `mailto:` ou
  endereço; seção social ausente/presente (mock de `@/lib/social-links`);
  metadata.
- Unitários: os três helpers, `ServiceCategoryRow`, `ContactFollowLinks`
  (`target`, `rel`, `sr-only`).
- Testes de Home/Portfolio/Footer permanecem inalterados.

### Passo 8 — Documentação

`docs/rules/rendering.md`, tabela por página:
- About: ISR (foto opcional, degradação silenciosa).
- Services: ISR via `getWorks()` + regra de agrupamento + "ADR-010
  deviation approved by user in CARSHOP-147".
- Contact: estático, links sociais do env, formulário futuro isolado.
- Linha de SEO com a redação "institutional pages".

Supersessão parcial do ADR-010 no Obsidian fica com o `knowledge-manager`
após a review.

### Passo 9 — Validação

- `lint`, `typecheck`, testes e `build` limpos; cobertura ≥ 80% no código
  novo.
- App rodando em **porta própria** (`next build && next start -p <porta
  própria>`), matando apenas o próprio PID; nunca derrubar o dev server do
  usuário.
- Verificar mobile/tablet/desktop: empilhado no mobile, 12 colunas a partir
  de `lg`, respiro extra em `md` + foto 16:9 no About.

## Requisitos transversais (imagens, a11y, responsivo)

- Apenas fotos reais do Cloudinary via `WorkImageThumb` (`fill` + aspect
  fixo, sem CLS). `preload` em no máximo uma imagem por página.
- Sem zoom em imagens não interativas; links de texto
  `hover:text-primary transition-colors`.
- Um `h1` por página; sem pular níveis de heading.
- Foco: `outline-none focus-visible:ring-3 focus-visible:ring-ring/50`.
- Alvos de toque `min-h-11`. Somente tokens existentes.

## Riscos

- Categorias em pt-BR numa página em inglês / categorias quase duplicadas
  (mitigação: normalização conservadora + follow-up para padronizar
  categorias no admin/backend).
- ISR pode servir conteúdo degradado por até 1h se a API cair.
- Poucos works → Services curta.
- Foto do About pode coincidir com a do hero da Home (aceitável).
- **Divergência declarada**: `visual-direction.md`/`components.md` esperam
  telefone/endereço/horário e descrições de serviço — pendentes por decisão
  do usuário.

## Follow-ups (não implementar nesta task)

- Renomear `HomeCtaActions` → `PublicCtaActions`.
- Footer usar `getSocialLinks` (dedupe).
- `changeFrequency` de `/services` no sitemap (hoje `monthly`).
- Remover `app/(public)/portfolio/node_modules/.vite/vitest/results.json`.
- Padronizar categorias no admin/backend.
- Copy pt-BR do footer.
- Dependências de conteúdo do negócio: telefone, endereço, horário, e-mail,
  área atendida, história/equipe do About, descrições aprovadas de serviços,
  fotos da loja/fachada, fluxo de orçamento.
- Interação de hover-image de serviços (`components.md`).
