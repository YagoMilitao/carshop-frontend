# CARSHOP-160 — Plano de implementação: Admin — selecionar a imagem principal (hero) da Home

Task classificada como **NON-TRIVIAL** pelo `spec-writer`
(`specs/CARSHOP-160/spec.md`). Este plano persiste fielmente a decisão do
`architect` e as decisões do usuário, traduzindo-as em passos acionáveis e
verificáveis para o `developer`. Nenhuma decisão arquitetural nova é
introduzida aqui.

Sem Figma: fonte visual autoritativa é `docs/design/*` (seções Admin de
`visual-direction.md`, `components.md`, `spacing.md`, `typography.md`,
`colors.md`, `imagery.md`).

## Decisões do usuário (vinculantes)

1. **Risco aceito**: as imagens candidatas vêm da listagem admin de works
   (`GET /works?includeDrafts=true`, via `adminWorksQueryKey`/`getAdminWorks`),
   carregada inteira e filtrada no cliente. O contrato atual não oferece
   listagem paginada/filtrada.
2. **Follow-up registrado**: endpoint paginado/filtrado futuro = **CARSHOP-172**
   (backlog). A fonte de candidatas fica isolada em um único hook para que a
   troca futura não afete os consumidores.

## Nota de contexto para CARSHOP-161 (não é escopo desta task)

A decisão validada em **CARSHOP-144** (Hero público usa a imagem `isCover` do
primeiro work) **continua vigente** após esta task. Quem a substitui é
**CARSHOP-161** (renderização do hero na Home pública a partir de
`GET /home-image`), não CARSHOP-160. Esta task não altera a Home pública. A
`spec.md` atual não registra essa nota; a sincronização é responsabilidade do
`spec-writer`.

## Contrato consumido (CARSHOP-159 — branch backend `feat/CARSHOP-159`)

- `GET /home-image` (público) → `200 { image: HomeImage | null }`; `429`.
- `PATCH /admin/home-image` (Bearer) — body estrito `{ workId, imageId }` →
  `200 { image: HomeImage }` (nunca `null`); erros `400`, `401`, `404`,
  `409`, `429`, `500`.
- `HomeImage = { workId: string; imageId: string; url: string; alt: string }`
  (`alt` pode ser vazio).

Não inventar endpoints; não enviar `url` nem qualquer campo extra no body.

## Decisão do architect (fonte de verdade — não reinterpretar)

### Rota e navegação
- Rota `/admin/imagem-da-home` em
  `app/(admin)/admin/(protected)/imagem-da-home/page.tsx`.
- 4º item de navegação após "Comentários" em `admin-nav-links.ts`:
  `{ href: "/admin/imagem-da-home", label: "Imagem da Home", match: "prefix" }`.
  Atualizar o comentário de cabeçalho citando CARSHOP-160 (continua
  proibindo inventar "Configurações"/"Usuários").
- Sem entrada no Dashboard.

### Server vs Client
- `page.tsx` **Server**: `metadata.robots` noindex/nofollow (igual às demais
  páginas admin), `PageSection spacing="compact"`, `Container variant="page"`,
  `AdminPageHeader` com título "Imagem da Home" e descrição "Escolha a foto
  principal exibida no topo da página inicial. Apenas imagens de trabalhos
  publicados podem ser usadas." Sem `<main>` (o `AdminShell` já fornece).
- **Única fronteira client**: `_components/home-image-settings.tsx`.
  Subcomponentes apresentacionais sem `"use client"` próprio.

### Services / tipos
- `lib/api/home-image.ts` (apenas tipos por ora): `HomeImage`,
  `HomeImageResponse = { image: HomeImage | null }`. (CARSHOP-161 adicionará
  depois o fetch server + `server-only`.)
- `lib/api/home-image.client.ts`:
  - `homeImageQueryKey = ["home-image"] as const`;
  - `SetHomeImagePayload = { workId: string; imageId: string }`;
  - `getHomeImage(): Promise<HomeImage | null>` via
    `http.get<HomeImageResponse>("/home-image")`;
  - `setHomeImage(payload): Promise<HomeImage>` via
    `http.patch<HomeImageResponse>("/admin/home-image", { workId: payload.workId, imageId: payload.imageId })`
    — body montado campo a campo, **nunca spread**; lançar erro se
    `data.image` vier `null` (sem casts).
- Fonte de candidatas (opção a): reutilizar `adminWorksQueryKey` /
  `getAdminWorks` de `lib/api/works.client.ts` com `select`.

### Isolamento para CARSHOP-172
- `_components/home-image-candidates.ts` (puro):
  - `HomeImageCandidateGroup = { workId; workTitle; images: WorkImage[] }`;
  - `selectHomeImageCandidates(works: Work[])`: mantém
    `status === "published" && deletedAt === null && images.length > 0`,
    na ordem da API, imagens ordenadas com `sortWorkImages`;
  - `isSameHomeImageRef(a, b)`: compara `workId` + `imageId`, **nunca URL**.
- `_components/use-home-image-candidates.ts`:
  `useQuery({ queryKey: adminWorksQueryKey, queryFn: getAdminWorks, select: selectHomeImageCandidates })`
  com `select` estável em nível de módulo. Retorna
  `{ groups, isPending, error, isFetching, refetch }`. Somente este hook
  conhece a fonte; consumidores chamam o `refetch` dele e **nunca**
  invalidam `adminWorksQueryKey` diretamente.

### Mutação e erros
- Em `HomeImageSettings`: `useQuery(homeImageQueryKey, getHomeImage)` e
  `useMutation(setHomeImage)`.
- `onSuccess`: `setQueryData(homeImageQueryKey, image)`; limpar seleção
  local; `toast.success("Imagem da Home atualizada.")` (sonner); focar o
  `h2` "Imagem atual" (`tabIndex={-1}`, mesmo padrão de
  `comment-moderation-panel`).
- `onError`: mensagem inline `role="alert"` próxima ao botão Salvar (sem
  toast duplicado); em `404`/`409` também refetch das candidatas e da
  imagem atual. Seleção local **derivada**: se a candidata selecionada não
  estiver mais na lista, é tratada como "sem seleção" (sem `useEffect` de
  sincronização).
- `_components/home-image-error.ts`: `getHomeImageErrorMessage(error)` e
  `shouldRefreshHomeImageCandidates(error)` (`404 | 409`), switch sobre
  `AxiosError` com fallback `getApiErrorMessage` (`lib/api/auth.client.ts`).
  Mensagens:
  - 400 "Seleção inválida. Atualize a página e tente novamente."
  - 401 "Sua sessão expirou. Faça login novamente."
  - 404 "Imagem ou trabalho não encontrado. A lista foi atualizada."
  - 409 "Este trabalho não está mais publicado. A lista foi atualizada; escolha outra imagem."
  - 429 "Muitas tentativas. Aguarde alguns instantes e tente novamente."
  - 500 "Não foi possível salvar a imagem da Home. Tente novamente."
- Não tocar nas mutações de works. Revalidação da Home pública fora de
  escopo (CARSHOP-161; ponto de extensão = `onSuccess`; **não** criar server
  action agora).

### UI (hierarquia: imagem atual → escolher outra → salvar)
1. `AdminPageHeader` sem `actions`.
2. Seção "Imagem atual" (`section aria-labelledby`, `h2` focável):
   - com imagem → preview 16:9; em `lg` split (preview ~2/3, metadados ao
     lado), empilhado abaixo disso. Metadados: título do work (dos grupos de
     candidatas; fallback `workId` se a lista falhar) e `alt` ou "Sem texto
     alternativo";
   - `image: null` → `AdminEmptyState` título "Nenhuma imagem da Home
     definida", descrição "Nenhuma imagem foi escolhida ou a imagem escolhida
     deixou de estar disponível (trabalho despublicado ou removido). Escolha
     uma imagem abaixo.";
   - loading `AdminLoadingState`; erro `AdminErrorState` com `onRetry`.
3. Seção "Imagens disponíveis" (`h2` com contagem total) dentro de
   `<form onSubmit>`: um `<fieldset>` por work com `<legend>` = título, na
   ordem da API; grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, thumbs
   `aspect-video`. Sem filtro por título. Loading/erro (retry)/vazio
   próprios; vazio: "Nenhuma imagem elegível", "Publique um trabalho com
   imagens para poder usá-lo na Home." + `Button asChild variant="outline"`
   com `Link` para `/admin/trabalhos`. Erro em uma seção não esconde a outra.
4. Barra de salvar (`sticky bottom-0 border-t bg-background`, dentro do form,
   apenas quando há candidatas): resumo `aria-live="polite"` ("Nenhuma
   alteração" / "Selecionada: imagem N do trabalho X"); erro inline;
   "Desfazer seleção" `ghost` (apenas quando alterado); submit "Salvar imagem
   da Home" primário ("Salvando..." quando pendente). Sem diálogo de
   confirmação. Reservar padding inferior para a barra não cobrir o último
   item no mobile.

### Acessibilidade / seleção
- Radios nativos (`<input type="radio">`, um único `name` em todo o form),
  `sr-only peer`; cada opção é um `<label>` envolvendo input +
  `WorkImageThumb` (`className="aspect-video"`, `fallbackAlt` de
  `getWorkImageLabel(image, index, workTitle)`) + indicadores:
  - badge de texto "Na Home" na ativa (não só cor);
  - ícone de check + borda/ring quando marcada (`peer-checked:`);
  - foco `peer-focus-visible:ring-3 ring-focus-ring`.
- Design guard (`test/design-system-guard.test.ts`): usar `outline-hidden`
  (não `outline-none`) e bordas `--input`.
- `checked = pendingSelection ?? activeRef`; nenhuma marcada se não houver
  ativa. Nome acessível: alt/fallback + " (imagem atual da Home)" na ativa.
- Durante o envio: `<fieldset disabled>` externo + botão desabilitado;
  `aria-busy={isFetching}` na seção de candidatas.
- Salvar desabilitado sem seleção ou quando igual à ativa
  (`isSameHomeImageRef`).

### Imagens
- Thumbs: `sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"`,
  lazy, sem `priority`/preload.
- Preview atual (`current-home-image.tsx`): `next/image` `fill object-cover`,
  `sizes="(min-width: 1024px) 640px, 100vw"`, sem preload.
- `remotePatterns` (`res.cloudinary.com`) permanece inalterado.

## Arquivos

**Novos** em `app/(admin)/admin/(protected)/imagem-da-home/`:
- `page.tsx`
- `_components/home-image-settings.tsx` (única fronteira client)
- `_components/current-home-image.tsx`
- `_components/home-image-candidate-list.tsx`
- `_components/home-image-candidate-option.tsx`
- `_components/home-image-save-bar.tsx`
- `_components/home-image-candidates.ts`
- `_components/use-home-image-candidates.ts`
- `_components/home-image-error.ts`
- testes correspondentes (`*.test.ts(x)`), incluindo `page.test.tsx`.

**Novos** em `lib/api/`: `home-image.ts`, `home-image.client.ts`,
`home-image.client.test.ts`.

**Alterados**:
- `app/(admin)/admin/(protected)/_components/admin-nav-links.ts`
- `admin-nav-links.test.ts` (lista + casos de `match`, incluindo falso
  positivo `/admin/imagem-da-homeX`)
- `admin-sidebar.test.tsx` e `admin-mobile-nav.test.tsx` (4 seções)

**Reutilizar sem alterar**: `AdminPageHeader`, `admin-states.tsx`,
`WorkImageThumb` (`components/gallery/work-image-thumb.tsx`), `Badge`,
`Button`, `sortWorkImages`/`getWorkImageLabel` de
`../trabalhos/_components/work-image-grid`.

**Não alterar**: `next.config.mjs`, `lib/api/http.ts`, `lib/api/works*.ts`,
`app/(admin)/admin/actions.ts`, Home pública.

(Confirmar caminhos exatos no repositório antes de editar.)

## Fases de implementação

Cada passo lista o que deve estar verificável ao final.

### Fase 0 — Pré-condições
1. Confirmar branch `feat/CARSHOP-160` (nunca trabalhar em `master`).
2. Confirmar em `package.json` as dependências usadas (`@tanstack/react-query`,
   `axios`, `sonner`, `react-icons`, `next`) — nenhuma dependência nova é
   esperada. Se algo faltar: **parar e reportar como blocker**.
3. Confirmar que `app/robots.ts` já bloqueia o prefixo `/admin` (cobrindo
   `/admin/imagem-da-home`). Se não cobrir, reportar ao `architect`/usuário
   em vez de alterar por conta própria.
4. Reconferir o contrato em `carshop-backend` (branch `feat/CARSHOP-159`):
   `docs/api-contract.md` seção "Home Image". Qualquer divergência → parar e
   reportar.

### Fase 1 — Camada de serviço
1. Criar `lib/api/home-image.ts` (tipos).
2. Criar `lib/api/home-image.client.ts` (query key, payload, `getHomeImage`,
   `setHomeImage`).
3. Testes (`home-image.client.test.ts`, mockando `http` como em
   `works.client.test.ts`): método/rota; `getHomeImage` retorna imagem ou
   `null`; `setHomeImage` envia exatamente `{ workId, imageId }` mesmo
   recebendo objeto mais largo (sem cast); lança quando `image` é `null`.

Verificável: `npm run test -- lib/api/home-image` verde; `npm run typecheck`.

### Fase 2 — Lógica pura e hook de candidatas
1. `home-image-candidates.ts` (`selectHomeImageCandidates`,
   `isSameHomeImageRef`, tipo do grupo).
2. `use-home-image-candidates.ts` (select estável em nível de módulo).
3. `home-image-error.ts` (mapeamento de mensagens + `shouldRefresh...`).
4. Testes:
   - candidatas: exclui draft, `deletedAt` preenchido e works sem imagens;
     mantém ordem da API; imagens ordenadas por `order`;
     `isSameHomeImageRef` por IDs, não por URL;
   - hook: reutiliza cache pré-populado de `["admin","works"]` sem nova
     chamada;
   - erros: 400/401/404/409/429/500/fallback; `shouldRefresh` só 404/409.

### Fase 3 — Navegação
1. Adicionar o item "Imagem da Home" em `admin-nav-links.ts` e atualizar o
   comentário de cabeçalho (CARSHOP-160).
2. Atualizar `admin-nav-links.test.ts`, `admin-sidebar.test.tsx`,
   `admin-mobile-nav.test.tsx`.

Verificável: testes de navegação verdes, incluindo o falso positivo
`/admin/imagem-da-homeX`.

### Fase 4 — Página e UI
1. `page.tsx` (Server) com metadata noindex, `PageSection`, `Container`,
   `AdminPageHeader`, renderizando `HomeImageSettings`.
2. `current-home-image.tsx` (preview + metadados + estados).
3. `home-image-candidate-option.tsx`, `home-image-candidate-list.tsx`
   (fieldsets por work, grid, estados).
4. `home-image-save-bar.tsx` (resumo live, erro inline, desfazer, submit).
5. `home-image-settings.tsx` (queries, mutação, seleção derivada, foco no
   `h2` após sucesso, refetch em 404/409).
6. Testes:
   - `page.test.tsx`: metadata noindex + `h1`;
   - integração de `HomeImageSettings` (QueryClient com `retry: false`):
     loading/erro/vazio independentes nas duas fontes; `image: null`; ativa
     marcada + "Na Home"; navegação por setas; Salvar desabilitado sem
     alteração; submit com body exato, cache atualizado, toast, foco no
     heading; duplo submit bloqueado; 404/409 disparam refetch de
     `getAdminWorks` + `getHomeImage` e exibem a mensagem.

### Fase 5 — Validação
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run test:coverage` — **≥ 80%** no código novo/alterado.
5. `npm run build`
6. Validação em runtime (obrigatória antes de reportar concluído):
   - subir o backend `carshop-backend` na branch **`feat/CARSHOP-159`**;
   - subir o frontend em **porta própria** (ex.: `next dev -p <porta livre>`,
     diferente de 3000). **Nunca encerrar o dev server do usuário** — não
     usar `pkill "next dev"`; encerrar apenas o PID do próprio processo;
   - fluxo: login admin → item "Imagem da Home" ativo na nav → ver imagem
     atual (ou estado vazio) → selecionar outra → salvar → toast, preview
     atualizado, "Na Home" movido;
   - forçar 409 (despublicar o work da seleção em outra aba antes de salvar)
     e confirmar mensagem + refetch;
   - confirmar que as URLs retornadas são de `res.cloudinary.com` (senão o
     `next/image` falha — reportar, não ampliar `remotePatterns`);
   - conferir mobile/tablet/desktop (barra sticky não cobre o último item),
     teclado (setas, foco visível) e leitor de tela (estado selecionado).

## Mapeamento DoD → passos

| Item de escopo da spec | Fase / passo |
| --- | --- |
| 1. Services + tipos + query key | Fase 1 |
| 2. Área admin identificada (rota/nav) | Fases 3 e 4.1 |
| 3. Exibir imagem atual / estado `null` | Fase 4.2 |
| 4. Navegar candidatas e identificar a ativa por IDs | Fases 2.1 e 4.3 |
| 5. Persistir via `PATCH` só com `{ workId, imageId }`, sem input de URL | Fases 1.2 e 4.5 |
| 6. Feedback de sucesso/erro e refletir nova seleção | Fase 4.5 |
| 7. Loading/vazio/erro com retry nas duas fontes | Fases 4.2 e 4.3 |
| 8. Mapeamento 400/401/404/409/429/500 + refetch em 404/409 | Fases 2.3 e 4.5 |
| 9. Acessibilidade e responsividade | Fase 4 + Fase 5.6 |
| 10. Testes, lint, typecheck, build, cobertura ≥ 80% | Fases 1–5 |

## Riscos e cuidados

1. **CARSHOP-159 não mergeado** — desenvolvimento e testes mockados podem
   seguir, mas **esta task não deve ser mergeada/liberada antes do merge e
   deploy de CARSHOP-159**. Qualquer mudança de contrato antes disso deve ser
   reconferida aqui. **Confirmar com o usuário a ordem de merge.**
2. **Payload completo de works** (risco aceito pelo usuário; isolado no hook;
   follow-up CARSHOP-172).
3. Host de imagem diferente de Cloudinary quebra `next/image`.
4. Candidatas desatualizadas → refetch em 404/409 + seleção derivada.
5. Grupo grande de radios nativos com navegação linear por setas (aceitável).
6. Barra sticky cobrindo o último item no mobile (reservar padding).

## Pontos a confirmar com o usuário

- Ordem de merge: CARSHOP-160 só após CARSHOP-159 no backend `master`.
- Se `app/robots.ts` não cobrir `/admin/*`, decidir antes de alterar.
- Sincronização da `spec.md` pelo `spec-writer` com a nota sobre CARSHOP-144
  → CARSHOP-161.

## Segurança

Nenhum segredo, token ou valor real de `.env` é necessário ou citado neste
plano. Credenciais de admin usadas na validação em runtime não devem ser
registradas em logs, relatórios ou commits.
