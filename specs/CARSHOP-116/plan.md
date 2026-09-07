# Plan — CARSHOP-116: Integrar Project Details e Portfolio com dados reais da API de projetos

> Classificação: NON-TRIVIAL. Plano persistido por `plan-writer` a partir da
> spec (`specs/CARSHOP-116/spec.md`) e da decisão arquitetural do
> `architect` (reproduzida abaixo, não reaberta nem alterada). Este plano
> apenas estrutura a sequência de implementação — nenhuma decisão de
> estrutura/roteamento/Server-Client nova é introduzida aqui.

## Bloqueio a confirmar com o usuário antes de iniciar

O `architect` confirmou e resolveu a lacuna identificada na spec: o
backend **não expõe** `GET /works/:slug` nem `GET /works/:id` público. A
mitigação escolhida (não é um bloqueio que impeça o início da
implementação, mas deve ser confirmada com o usuário antes do `developer`
seguir) é:

- `GET /works` (lista completa, pública, já existe) é buscado no Server
  Component de detalhe e o item é filtrado por `slug` no servidor,
  retornando `notFound()` do Next quando não há correspondência.
- Isso implica que o detalhe reaproveita a mesma fonte de dados da
  listagem (o Next Data Cache deduplica as chamadas de `fetch` idênticas
  na mesma revalidação), em vez de uma chamada dedicada por item.
- Nenhum endpoint novo é criado no backend nesta task; `includeDrafts`/auth
  seguem fora de escopo.

Se o usuário não confirmar esta mitigação antes do passo 1, a
implementação não deve prosseguir para os passos 2–4 (a camada de dados do
passo 1 é neutra em relação a essa decisão e pode ser construída em
paralelo).

## Ordem de execução

### Passo 1 — Camada de acesso a dados (`lib/api/works.ts`) + testes

Arquivos:
- Criar `lib/api/works.ts`.
- Criar `lib/api/works.test.ts`.

Conteúdo esperado (conforme decisão do `architect`, sem detalhar
implementação linha a linha):
- Tipos `WorkStatus`, `WorkImage`, `Work` no próprio arquivo (sem pasta
  `types/` nova), fiéis ao contrato JSON documentado em
  `specs/CARSHOP-116/spec.md` (`id`, `slug`, `title`, `description`,
  `category`, `tags`, `images[]`, `status`, `createdAt`, `updatedAt`,
  `deletedAt`).
- Constante nomeada `WORKS_REVALIDATE_SECONDS = 3600`.
- `getWorks(): Promise<Work[]>` — `fetch` nativo do Next (nunca a
  instância Axios de `lib/api/http.ts`) contra
  `` `${serverEnv.apiUrl}/works` ``, com
  `{ next: { revalidate: WORKS_REVALIDATE_SECONDS, tags: ['works'] } }`.
  Base URL sempre via `serverEnv.apiUrl` (`lib/env/server.ts`), nunca
  `process.env` direto.
- `getWorkBySlug(slug: string): Promise<Work | undefined>` — chama
  `getWorks()` internamente e faz `.find(w => w.slug === slug)` (não é uma
  chamada HTTP adicional).
- `getCoverImage(work: Work): WorkImage | undefined` — `work.images.find(i
  => i.isCover)`.
- Nomenclatura de código sempre `Work`/`getWorks`/`getWorkBySlug`/
  `getCoverImage`; "Projeto" só em texto de UI (passos 2–3), nunca em
  nomes de tipo/função/arquivo.

Testes (`lib/api/works.test.ts`), mockando `fetch` global (nenhuma chamada
de rede real):
- `getWorks`: sucesso com mapeamento de campos (array retornado igual ao
  JSON mockado).
- `getWorkBySlug`: caso encontrado e caso não encontrado (`undefined`).
- `getCoverImage`: caso com `isCover: true` presente e caso sem nenhuma
  imagem de capa (`undefined`).

Critério de pronto do passo:
- `lib/api/works.ts` compila em modo estrito (sem `any`/cast inseguro).
- `npm run typecheck` e `npm run lint` passam para este arquivo isolado.
- `lib/api/works.test.ts` cobre os 3 grupos de caso acima e passa.
- Nenhuma chamada de rede real disparada nos testes.

### Passo 2 — Listagem (`app/(public)/portfolio/page.tsx`)

Arquivos:
- Editar `app/(public)/portfolio/page.tsx` (remove o stub e o comentário
  `TODO` de listagem estática).
- Editar/criar `app/(public)/portfolio/page.test.tsx`.

Mudanças esperadas:
- Server Component (sem `"use client"`) que chama `getWorks()` de
  `lib/api/works.ts` e renderiza a lista de `Work`s reais.
- Preservar a estrutura de `metadata` já existente (`title`,
  `description`, `alternates.canonical`, `openGraph`) — não é objeto desta
  task alterar SEO estático da listagem além de já documentado.
- Texto visível ao usuário pode usar "Projeto"/"Projetos" livremente
  (rótulos de UI), mesmo consumindo `Work` internamente.

Testes (`page.test.tsx`):
- Listagem renderizada corretamente a partir de `getWorks()` mockado
  (mock do módulo `lib/api/works`, não de `fetch`).

Critério de pronto do passo:
- Página renderiza a lista com dados de `Work` mockados no teste, sem
  dado fictício/hardcoded na página em si.
- `npm run typecheck`/`lint` seguem passando.
- Teste do passo 2 passa.

### Passo 3 — Detalhe + `generateMetadata` (`app/(public)/portfolio/[slug]/page.tsx`)

Arquivos:
- Editar `app/(public)/portfolio/[slug]/page.tsx` (remove o placeholder e
  o comentário `TODO`).
- Editar/criar `app/(public)/portfolio/[slug]/page.test.tsx`.

Mudanças esperadas (fiel à decisão do `architect`):
- `generateStaticParams()`: chama `getWorks()` e retorna `{ slug }` para
  todos os `Work`s.
- Manter `dynamicParams` no padrão do Next (`true`; não sobrescrever com
  `false`) — permite resolver sob demanda um slug publicado após o último
  build.
- Corpo da página: `getWorkBySlug(slug)`; se `undefined`, chamar
  `notFound()` do Next (`next/navigation`).
- `generateMetadata`: também usa `getWorkBySlug(slug)`; se `undefined`,
  chamar `notFound()` dentro do próprio `generateMetadata`; usar
  `getCoverImage(work)` para popular `openGraph.images` quando existir
  capa — se não houver capa, não inventar imagem: herdar o comportamento
  base já definido em `app/layout.tsx`.
- Preservar `alternates.canonical` derivado do `slug` (já correto no stub
  atual, `` `/portfolio/${slug}` `` — manter o mesmo padrão).

Testes (`page.test.tsx`):
- Detalhe encontrado: renderiza dados reais de um `Work` mockado.
- Detalhe não encontrado: `notFound()` é chamado (mock de
  `next/navigation`).
- `generateMetadata` com imagem de capa: `openGraph.images` populado a
  partir da capa mockada.
- `generateMetadata` sem imagem de capa: não força imagem inventada
  (comportamento herdado, sem erro).
- `generateMetadata` com slug inexistente: `notFound()` chamado.

Critério de pronto do passo:
- Todos os 5 casos de teste acima cobertos e passando.
- Nenhum Client Component introduzido (fora de escopo — ver seção "Fora
  de escopo" abaixo).
- `npm run typecheck`/`lint` seguem passando.

### Passo 4 — `app/sitemap.ts`

Arquivos:
- Editar `app/sitemap.ts` (remove o comentário `TODO` sobre entradas de
  `/portfolio/[slug]`).
- Editar/criar `app/sitemap.test.ts`.

Mudanças esperadas:
- Chamar o mesmo `getWorks()` de `lib/api/works.ts` usado nos passos 2–3
  (mesma fonte de dados/revalidate).
- Gerar uma entrada por `Work`: `url: /portfolio/${work.slug}` (resolvido
  via `new URL(...)` contra `clientEnv.NEXT_PUBLIC_SITE_URL`, seguindo o
  padrão já usado para `staticRoutes`), `lastModified: work.updatedAt`
  (dado real por item — não mais `new Date()` global para essas entradas).
- Filtro defensivo opcional `w.status === 'published'` antes de mapear.
- Preservar integralmente o array `staticRoutes` já existente e o
  `lastModified: new Date()` usado para as rotas estáticas — apenas
  concatenar as novas entradas dinâmicas ao array de retorno, sem alterar
  o comportamento das rotas estáticas atuais.

Testes (`sitemap.test.ts`):
- Entradas dinâmicas de portfolio presentes (uma por `Work` mockado, com
  `url`/`lastModified` corretos).
- Rotas estáticas preservadas (mesmas 5 entradas de `staticRoutes` de
  hoje, inalteradas).

Critério de pronto do passo:
- `sitemap()` retorna staticRoutes + entradas dinâmicas de `Work`s
  mockados nos testes.
- Ambos os grupos de asserção do teste passam.
- `npm run typecheck`/`lint` seguem passando.

### Passo 5 — Documentação (`docs/rules/rendering.md`)

Arquivo:
- Editar `docs/rules/rendering.md`, seção "Estratégia por página
  (CARSHOP-114)".

Mudanças esperadas:
- Atualizar as linhas da tabela referentes a "Portfolio — listagem" e
  "Project Details" para refletir o estado real pós-implementação desta
  task: ISR com `revalidate` (`WORKS_REVALIDATE_SECONDS` = 3600s/1h),
  `generateStaticParams` implementado para o detalhe, fonte de dados real
  (`GET /works` via `lib/api/works.ts`), e a mitigação adotada para o
  detalhe por slug (fetch de `GET /works` + filtro no servidor, sem
  endpoint dedicado).
- Atualizar a última frase da seção "SEO técnico (CARSHOP-114)" sobre
  `sitemap.ts` — o `TODO` de `portfolio/[slug]` deixa de existir; refletir
  que as entradas agora vêm de dados reais.
- Não renomear o título da seção nem reescrever partes não afetadas por
  esta task (Home/About/Services/Contact/Admin permanecem como estão).

Critério de pronto do passo:
- Tabela e texto da seção SEO técnico não mencionam mais `TODO`/"quando a
  API existir" para Portfolio/Project Details/sitemap — apenas para o que
  ainda for de fato futuro (não aplicável aqui, já que a API existe e foi
  integrada).

## Critérios de aceite finais (mapeados ao DoD da spec)

| Critério (spec) | Coberto em |
|---|---|
| Fetch real de `Work`(s) via `GET /works`, `fetch` nativo, sem placeholder | Passo 1 |
| `[slug]/page.tsx` usa dados reais em `generateMetadata` | Passo 3 |
| `portfolio/page.tsx` lista projetos publicados reais | Passo 2 |
| `sitemap.ts` inclui uma entrada por `Work` publicado, rotas estáticas preservadas | Passo 4 |
| Estratégia de rendering/ISR aplicada e documentada | Passos 1, 3, 5 |
| Nenhum dado fictício/copy inventado | Passos 1–4 |
| Build/lint/typecheck passam; testes cobrindo os novos fluxos | Todos os passos + validação final abaixo |
| Decisão sobre a lacuna do endpoint de detalhe tomada explicitamente | Seção "Bloqueio a confirmar com o usuário" (já decidida pelo `architect`) |

## Validação final (após o passo 5)

Rodar, nesta ordem, em
`/Users/yagomilitao/DEV/Frontend/React/carshop-frontend`:
1. `npm run typecheck`
2. `npm run lint`
3. `npm test` (ou o comando de teste configurado) cobrindo todos os
   arquivos novos/alterados dos passos 1–4.
4. `npm run build` — confirmar que `generateStaticParams` do detalhe
   executa sem erro contra os dados reais (ou mockados, se o build local
   não tiver acesso ao backend rodando).

## Arquivos a criar/editar (lista consolidada)

- `lib/api/works.ts` (novo)
- `lib/api/works.test.ts` (novo)
- `app/(public)/portfolio/page.tsx` (editar)
- `app/(public)/portfolio/page.test.tsx` (editar/criar)
- `app/(public)/portfolio/[slug]/page.tsx` (editar)
- `app/(public)/portfolio/[slug]/page.test.tsx` (editar/criar)
- `app/sitemap.ts` (editar)
- `app/sitemap.test.ts` (editar/criar)
- `docs/rules/rendering.md` (editar)

## Fora de escopo (reforço — não implementar nesta task)

- Qualquer Client Component (carrossel/lightbox de imagens).
- Qualquer endpoint novo no backend, ou uso de `includeDrafts`/autenticação.
- Qualquer dependência nova em `package.json` (nenhuma é necessária para
  este plano).
- Alterar o comportamento das rotas estáticas existentes no sitemap além
  de concatenar as novas entradas dinâmicas.
- Migração de nomenclatura de rotas (`portfolio` → outro nome) ou troca de
  `[slug]` por `[id]`.

## Segurança

- Nenhum segredo, token ou valor real de `.env` é referenciado neste
  plano ou deve ser referenciado na implementação — `serverEnv.apiUrl` é a
  única forma de acesso à URL base da API, já validada via `lib/env/
  server.ts`/`lib/env/client.ts` (Zod), sem leitura direta de
  `process.env` em código de feature.
