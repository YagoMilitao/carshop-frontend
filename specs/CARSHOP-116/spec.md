# CARSHOP-116 — Integrar Project Details e Portfolio com dados reais da API de projetos

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Público
- **Component**: Public UI
- **Stack**: Frontend
- **Sprint**: Sprint 3
- **Priority**: Medium
- **Status**: Backlog

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-116` no Notion
Task Tracker (não duplicadas aqui além do necessário para orientar o
trabalho — ver seções abaixo).

## Objetivo

Substituir os stubs de Portfolio (listagem) e Project Details (detalhe) —
criados como placeholders na `CARSHOP-114`, com TODOs explícitos — por
dados reais consumidos do backend (`carshop-backend`, recurso `Work`),
incluindo metadata/Open Graph dinâmicos, entrada no sitemap por projeto
real, e estratégia de rendering (static/ISR) conforme
`docs/rules/rendering.md`.

## Estado real do repositório (verificado nesta sessão)

- Stubs da `CARSHOP-114` confirmados, cada um com TODO explícito e teste ao
  lado:
  - `app/(public)/portfolio/page.tsx:4-5` — listagem estática por ora;
    candidato a ISR quando a API existir.
  - `app/(public)/portfolio/[slug]/page.tsx:7` — placeholder a ser
    substituído por fetch real via `params.slug`.
  - `app/sitemap.ts:15-16` — entradas de `/portfolio/[slug]` ainda
    excluídas por falta de dados.
- `docs/rules/rendering.md` já documenta a estratégia pretendida: listagem
  de Portfolio como Server Component candidato a ISR quando vier de API
  real; Project Details hoje estático/stub sem `generateStaticParams`,
  devendo evoluir para `generateStaticParams` + ISR quando a API existir;
  sitemap com slugs reais condicionado à API existir.
- Infra HTTP genérica já existe, mas não é adequada a esta task sem
  ressalva: `lib/api/http.ts` é uma instância Axios explicitamente marcada
  como client-side only (comentário no próprio arquivo orienta usar `fetch`
  nativo do Next para Server Components / fetching server-side). `lib/env/
  client.ts` e `lib/env/server.ts` validam env vars via Zod, incluindo
  `NEXT_PUBLIC_API_URL=http://localhost:3333` em `.env.example`.
- Não existe nenhum client/service/hook/tipo já implementado para
  "work"/"project"/"portfolio" no frontend — precisa ser criado do zero
  (tipos, camada de acesso a dados, mapeamento para a UI).

## Contrato real da API do backend (confirmado pelo time de backend)

O recurso no backend é **`Work`**, não `Project` — mapeado conceitualmente
para "Projeto" na UI, mas o tipo/cliente de API deve refletir o nome real
do recurso (`Work`). Decisão de nomenclatura de código fica a critério do
`architect`/`developer`; não deve ser inventado um endpoint `/projects`.

### Listagem — `GET /works`

- Público por padrão; filtro padrão (sem auth) é `status: 'published' AND
  deletedAt: null`. Query param opcional `?includeDrafts=true` exige Bearer
  token — fora de escopo desta task (sem auth implementada no frontend).
- Sem paginação (array completo, ordenado por `createdAt: -1`), sem
  envelope `data`/`meta`, sem filtros de categoria/tag.
- Shape de cada item:

```json
{
  "id": "uuid",
  "slug": "restauracao-banco-fusca-1978",
  "title": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "images": [
    {
      "id": "string",
      "url": "string",
      "publicId": "string",
      "alt": "string",
      "isCover": true,
      "order": 0,
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ],
  "status": "published",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "deletedAt": null
}
```

- `category`/`tags` são strings simples. Timestamps de imagem são cópias
  dos timestamps do `Work` pai (não são reais por imagem). Imagem de capa
  resolvida via `images.find(i => i.isCover)`.
- O Swagger do backend (`src/infra/docs/works.swagger.ts`) está
  desatualizado em relação a este shape (não documenta `images`,
  `createdAt`, `updatedAt`, `deletedAt`) — **não usar o Swagger como fonte
  de verdade** para esta task.

### Detalhe por slug — lacuna real de backend

Não existe `GET /works/:id` nem `GET /works/:slug` público; o único
identificador em rotas HTTP é `:workId` (UUID), usado apenas em
comentários/admin. Detalhe na seção "Riscos/Dependências" abaixo.

## Escopo (derivado da Descrição/DoD)

1. Camada de acesso a dados para `Work` (tipos TypeScript estritos +
   função(ões) de fetch), usando `fetch` nativo do Next para os Server
   Components envolvidos (não `lib/api/http.ts`, que é client-side only).
2. `app/(public)/portfolio/page.tsx`: listagem real via `GET /works`,
   substituindo o stub.
3. `app/(public)/portfolio/[slug]/page.tsx`: fetch real usando
   `params.slug` (mecanismo exato de resolução do slug depende da decisão
   do `architect` — ver Riscos/Dependências), substituindo o placeholder.
4. `generateMetadata` dinâmico em `[slug]/page.tsx` — `title`,
   `description` e `openGraph` a partir dos dados reais do `Work`
   encontrado (incluindo imagem de capa quando aplicável a Open Graph).
5. `app/sitemap.ts`: uma entrada por `Work` publicado real
   (`/portfolio/[slug]`), preservando as entradas estáticas já existentes.
6. Avaliação e aplicação de `generateStaticParams`/`revalidate` (ISR) para
   listagem e detalhe, conforme a estratégia já documentada em
   `docs/rules/rendering.md` — decisão de estrutura concreta é do
   `architect`, não presumida aqui.
7. Testes cobrindo os novos fluxos de dados (fetch real mockado na camada
   HTTP, `generateMetadata`, sitemap com entradas dinâmicas, caso 404 para
   slug inexistente).
8. Build/lint/typecheck passam.

## Fora de escopo

- Autenticação/`includeDrafts=true` (sem Bearer token implementado no
  frontend) — listagem cobre apenas projetos publicados.
- Implementar o endpoint de detalhe por slug no backend (repositório
  `carshop-backend`, fora deste repositório).
- Qualquer dado fictício/copy inventado — apenas dados reais retornados
  pela API.
- Filtros de categoria/tag na UI (não suportados pela API atual).
- Migração de nomenclatura de rotas (`portfolio` → outro nome) ou mudança
  de `[slug]` para `[id]`.

## Riscos/Dependências (decisão do `architect`, não resolvida nesta spec)

**Lacuna confirmada no backend**: não há endpoint público de detalhe por
`slug` nem por `id` para um `Work` isolado — apenas `GET /works` (lista
completa) é público. O backend tem `findBySlug` implementado internamente
(uso interno para checar unicidade na criação), mas falta a camada HTTP
(rota, controller, use case, Swagger, testes) para expor isso.

Duas alternativas foram identificadas, e a escolha entre elas é uma decisão
arquitetural do `architect`, não do `spec-writer`:

1. **Mitigação dentro do frontend**: `[slug]/page.tsx` (Server Component)
   faz fetch de `GET /works` (array completo) e filtra/encontra o item cujo
   `slug` bate com `params.slug` no servidor, retornando `notFound()` do
   Next se não encontrar. Usa dados 100% reais, sem endpoint dedicado e sem
   adotar `[id]`, mas tem custo de buscar a lista inteira para renderizar 1
   item (relevante para a decisão de cache/ISR).
2. **Bloquear** a implementação do detalhe real até o backend expor um
   endpoint dedicado (`GET /works/:slug` ou equivalente), mantendo o stub
   de `[slug]/page.tsx` mais tempo — nesse caso apenas a listagem de
   Portfolio avançaria nesta task, e o restante do DoD ficaria parcialmente
   não atendido (sinalizar impacto no DoD se essa rota for escolhida).

**Ação**: este conflito é sinalizado ao usuário e ao `architect` antes da
implementação — não deve ser resolvido unilateralmente pelo `developer`.

## Critérios de aceite (derivados do DoD do Notion)

- [ ] Fetch real de `Work`(s) implementado via `GET /works` (sem
      placeholder), usando `fetch` nativo do Next em Server Components.
- [ ] `app/(public)/portfolio/[slug]/page.tsx` usa dados reais para
      `title`/`description`/`openGraph` via `generateMetadata`.
- [ ] `app/(public)/portfolio/page.tsx` lista projetos publicados reais.
- [ ] `app/sitemap.ts` inclui uma entrada por `Work` publicado real
      (`/portfolio/[slug]`), preservando as rotas estáticas já existentes.
- [ ] Estratégia de rendering (static/ISR) aplicada e `revalidate`
      configurado conforme `docs/rules/rendering.md`.
- [ ] Nenhum dado fictício/copy inventado — apenas dados reais da API.
- [ ] Build/lint/typecheck passam; testes cobrindo os novos fluxos de
      dados (listagem, detalhe, metadata dinâmica, sitemap, 404 de slug
      inexistente).
- [ ] Decisão sobre a lacuna do endpoint de detalhe (mitigação via
      `GET /works` + filtro server-side vs. bloquear) tomada
      explicitamente pelo `architect`/usuário, não implícita no código.

## Arquivos prováveis a tocar

- `app/(public)/portfolio/page.tsx`
- `app/(public)/portfolio/page.test.tsx`
- `app/(public)/portfolio/[slug]/page.tsx`
- `app/(public)/portfolio/[slug]/page.test.tsx`
- `app/sitemap.ts`
- `app/sitemap.test.ts`
- Novo(s) arquivo(s) de tipos/cliente de dados para `Work` (localização
  exata — ex. `lib/api/works.ts` ou equivalente — é decisão do
  `architect`/`developer`, não definida aqui).

## Observação lateral (fora do foco desta task)

O `CLAUDE.md` descreve o estado atual do projeto como "Vite + React
Router", mas o código real já é 100% Next.js App Router (`next dev/build/
start`, Next `^16.3.4`, React `^19.2.0`, sem `react-router` nem pasta
`src/`). Sinalizado apenas como observação; não é objeto desta task
corrigir a documentação do fluxo.

## Classificação de tamanho: NON-TRIVIAL

Justificativa: a task toca múltiplas áreas (nova camada de acesso a dados,
duas rotas de página, `generateMetadata` dinâmico, `sitemap.ts`, estratégia
de rendering/ISR) e depende de uma decisão arquitetural explícita e não
trivial — como mitigar a lacuna do endpoint de detalhe por slug (buscar
`GET /works` inteiro e filtrar no servidor vs. bloquear a feature até o
backend expor um endpoint dedicado), o que também afeta a estratégia de
cache/ISR escolhida. Não se enquadra em `TRIVIAL` (não é mudança pontual de
baixo risco) nem em `SMALL` (múltiplos arquivos/áreas e decisão
arquitetural obrigatória). **Plano obrigatório via `plan-writer`.**

## Próximos agentes necessários

1. **Sinalizar ao usuário** o conflito/lacuna do endpoint de detalhe por
   slug descrito em "Riscos/Dependências" antes de prosseguir.
2. `knowledge-reader` — consultar Obsidian (`CarShop/Architecture`,
   `CarShop/ADRs`) por decisões prévias sobre consumo de `Work`/API de
   projetos, estratégia de fetch em Server Components, ou `ADR-001`
   (Axios) aplicado a este caso, e `CarShop/Studies` como não vinculante.
3. `architect` — decidir a estrutura de fetch (mitigação via `GET /works` +
   filtro server-side vs. bloquear detalhe), Server vs Client Components
   para listagem/detalhe, e a estratégia concreta de `generateStaticParams`/
   `revalidate` (ISR), conforme `docs/rules/rendering.md` (somente leitura).
4. `plan-writer` — persistir `plan.md` (task NON-TRIVIAL), detalhando a
   sequência de implementação, arquivos exatos e casos de teste.
