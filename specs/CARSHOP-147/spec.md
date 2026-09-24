# CARSHOP-147 — Redesenhar páginas públicas institucionais restantes

## Referência

Tarefa no Notion: CARSHOP-147 (Description, DoD de 7 itens e Technical Notes
completos na tarefa — aqui só o essencial).

Sprint 6 · Priority Medium · 5 pts · Epic Frontend Público · Component:
Public UI · Branch `feat/CARSHOP-147`, **baseada em `origin/master`
`21675a4`**, que já contém a CARSHOP-146 mergeada (PR #37). **Sem Figma**:
fonte visual autoritativa é `docs/design/*` (Technical Notes), em especial
`components.md` → "Eyebrow / Label", "Services", "Service Interaction";
`visual-direction.md` → "Public Page Experience", "Anti-SaaS Rule", bloco
de contato/conversão; `imagery.md` → "Service Imagery" e About/Contact;
`spacing.md` e `typography.md` (About copy, service names/introductions).

Referências visuais já implementadas (não reabrir): Home (CARSHOP-144),
`/portfolio` (CARSHOP-145), `/portfolio/[slug]` (CARSHOP-146). Decisões
herdadas: copy pública em inglês, `category` exibida como vem da API,
nenhuma informação de negócio inventada, "Get a Quote" desabilitado,
`cn` importado de `@/lib/utils`.

Objetivo: levar as páginas institucionais **que já existem** para a mesma
linguagem visual da Home/Portfolio, sem criar rotas, serviços, formulários
ou informações de negócio fora do escopo atual.

Plano de implementação: `specs/CARSHOP-147/plan.md`.

## Inventário preliminar (o inventário autoritativo é do `architect` — DoD 1)

Rotas públicas em `app/(public)/` (não existe `src/app`):

| Rota | Arquivo | Estado atual |
| --- | --- | --- |
| `/` | `page.tsx` | Redesenhada (144) — referência |
| `/portfolio` | `portfolio/page.tsx` | Redesenhada (145) — referência |
| `/portfolio/[slug]` | `portfolio/[slug]/page.tsx` | Redesenhada (146, mergeada) — referência |
| `/about` | `about/page.tsx` | **Placeholder** |
| `/services` | `services/page.tsx` | **Placeholder** |
| `/contact` | `contact/page.tsx` | **Placeholder** |

As três rotas institucionais são Server Components estáticos idênticos:
`PageSection` + `h1` (`text-heading-1`) + parágrafo "Página em construção."
(**pt-BR**). `metadata` com title, canonical absoluto via
`NEXT_PUBLIC_SITE_URL` e OG com description "... — page under
construction." (inglês). `contact/page.tsx` tem comentário prevendo um
formulário futuro como Client Component isolado — **nenhum formulário
existe hoje**. Testes (`page.test.tsx` de cada rota) verificam `h1`, o texto
"Página em construção." e a metadata.

Outros pontos de contato: `components/layout/nav-links.ts` (Services, Our
Work, About, Contact), `app/sitemap.ts` (as três rotas com `monthly`),
`components/layout/footer.tsx` (links sociais opcionais vindos de variáveis
de ambiente server-side — apenas nomes, sem valores aqui; copy do footer em
pt-BR). Nenhum endpoint de backend serve conteúdo institucional (serviços,
história, contato); o único dado público de backend é `GET /works`.

## Fontes de conteúdo realmente disponíveis

- Tagline já publicada na Home: "Upholstery · Restoration · Custom Work" e
  headlines da Home/Final CTA (aprovadas na 144).
- `category` real dos works via `getWorks()` (valores em pt-BR, string
  livre, sem endpoint de categorias).
- Fotografias reais de works (Cloudinary) via `getWorks()`/`getCoverImage()`.
- Links sociais configurados por ambiente (podem estar ausentes).
- CTAs existentes: "View Our Work" (`/portfolio`) e "Get a Quote"
  (desabilitado).

**Não existe** fonte confirmada para: lista/descrição de serviços, história
/ equipe / anos de experiência, endereço, telefone, e-mail, horário, área
atendida, depoimentos, fluxo de orçamento ou endpoint de contato.

## Decisões do usuário (Conflitos 1–5 resolvidos)

1. **Conteúdo — híbrido (c)**: apenas conteúdo confirmado; composição
   pronta para receber copy aprovada no futuro; nenhum placeholder vazio
   visível.
2. **Services** lista as categorias reais de trabalho de `GET /works` via
   `getWorks()` → página passa a ISR (desvio do ADR-010 aprovado pelo
   usuário).
3. **About** também passa a ISR para exibir uma foto real de work (segundo
   desvio do ADR-010, aprovado pelo usuário).
4. **Contact** estático: links sociais do ambiente + CTAs; sem formulário
   e sem endpoint. Telefone/endereço/horário ficam como dependência de
   conteúdo do negócio (não inventar). DoD 5 = N/A.
5. **Idioma/metadata**: toda a copy das três páginas em inglês; descriptions
   sem "under construction", mantendo title/canonical/estrutura OG. Copy
   pt-BR do footer fora de escopo (follow-up).

O `architect` registrou o inventário (DoD 1), a composição por página, os
contratos e a estratégia de rendering; o detalhamento está em `plan.md`. O
bloqueio §0 do architect (dependência da 146 / prop `preload` em
`WorkImageThumb`) está **resolvido**: usar `preload`, não `priority`.

## Escopo

- Redesenhar apresentação de `about/page.tsx`, `services/page.tsx` e
  `contact/page.tsx` (e componentes colocados definidos pelo `architect`),
  seguindo `docs/design/*` e as referências 144/145/146.
- Conteúdo restrito ao confirmado; nenhum texto fictício.
- Hierarquia: um `h1` por página, headings hierárquicos, eyebrows usados com
  parcimônia.
- Imagens: apenas fotografia real de works via `WorkImageThumb`/`next/image`,
  `sizes` por breakpoint, aspect-ratio fixo (sem CLS), `preload` só na
  imagem LCP (no máximo uma por página), alt `image.alt || work.title`.
- Metadata atualizada conforme decisão 5.
- Testes: reescrever os três `page.test.tsx` e cobrir helpers/componentes
  novos.
- `docs/rules/rendering.md` atualizado com a nova estratégia por página.

## Fora de escopo

- Criar rotas novas (ex.: `/quote`, `/services/[slug]`, before/after) ou
  alterar `nav-links.ts`/`sitemap.ts` (exceto se o inventário revelar
  inconsistência — reportar, não corrigir silenciosamente).
- Criar formulário de contato, endpoint, Route Handler ou contrato de
  backend; habilitar "Get a Quote".
- Inventar serviços, preços, história, equipe, depoimentos, anos de
  experiência, endereço, telefone, e-mail, horário ou área atendida.
- Alterar Header/Footer (shell da 143), `lib/api/*`, cache/tags,
  `WorkImageThumb` de forma que mude Home/Portfolio/Gallery.
- Reabrir Home, `/portfolio` ou `/portfolio/[slug]`.
- Imagens stock/IA ou placeholders apresentados como trabalho real.
- Expor valores de variáveis de ambiente.

## Critérios de aceite (derivados do DoD)

1. Inventário das rotas públicas registrado pelo `architect`; nenhuma rota
   criada ou removida.
2. About/Services/Contact usam os tokens públicos de tipografia, cor e
   spacing da Home/Portfolio, com composição editorial (sem cards SaaS
   uniformes, sem ícones genéricos como elemento principal).
3. Nenhum serviço ou conteúdo factual inventado; toda afirmação rastreável a
   fonte confirmada.
4. Contact não publica endereço, telefone, horário ou canais não
   confirmados; links sociais só aparecem se configurados.
5. DoD 5 registrado como N/A (não existe formulário); se o usuário aprovar
   formulário em outra task, fica fora desta.
6. As três páginas têm composições distintas, sem repetição mecânica.
7. Mobile/tablet/desktop verificados com a app rodando em porta própria;
   foco visível, touch targets ≥ 44px, contraste WCAG, `motion-safe` em
   animações; `lint`, `typecheck`, `build` e testes relevantes passam;
   cobertura ≥ 80% no código novo/alterado.

## Riscos

- Páginas enxutas sem conteúdo aprovado podem parecer curtas (mitigado pela
  composição híbrida).
- Usar categorias da API como "serviços" acopla a página ao cadastro do
  admin e mistura pt-BR com copy em inglês.
- About/Services passam de estático para ISR (desvios do ADR-010 aprovados);
  com a API fora, conteúdo degradado por até 1h.

## Classificação de tamanho

**NON-TRIVIAL** — três rotas redesenhadas com composições distintas,
decisões de UI/arquitetura (inventário, composição, ISR com `getWorks()`,
reuso de componentes da Home) e decisões de conteúdo do usuário. Plano
persistido obrigatório (`plan.md`).

## Próximos agentes

- `developer`: implementar seguindo `plan.md`.
- `tester`, `reviewer` (incluindo revisão visual), `task-manager`,
  `knowledge-manager` (supersessão parcial do ADR-010 no Obsidian).
