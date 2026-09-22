# CARSHOP-154 — Conectar persistência real (PATCH) na edição de trabalhos

## Referência

Ver task completa no Notion: CARSHOP-154 (Description, DoD, Technical Notes).
Dependências: CARSHOP-32 (Done/Review — form de edição), CARSHOP-135 (Done —
endpoint PATCH real).

## Estado atual confirmado no repositório

- `lib/api/works.client.ts`:
  - `UpdateWorkPayload = CreateWorkPayload` (todos os campos obrigatórios,
    sem refletir o contrato real).
  - `updateWork(workId, payload)` é um stub: não faz nenhuma chamada HTTP,
    apenas rejeita com um `Error` citando a CARSHOP-135.
  - `createWork`, `deleteWork` já usam `http` (Axios) real e servem de
    padrão de implementação.
- `.../[slug]/editar/edit-work-form.tsx`:
  - Carrega o `Work` pelo `slug` via `getAdminWorks()` + `findAdminWorkBySlug`
    (já funcional).
  - `useForm` com `workFormSchema` (compartilhado com criação) já
    pré-preenche via `mapWorkToFormValues`.
  - Não há `handleSubmit`/`onSubmit` implementado; o botão "Salvar" nasce
    `disabled`, `aria-disabled="true"`, `title="Disponível em breve"`.
- `CreateWorkForm` (`.../novo/create-work-form.tsx`) já implementa o padrão
  de submit real a ser replicado: `useForm` + `handleSubmit`, chamada à API
  dentro de `try/catch` usando `getApiErrorMessage`, em caso de sucesso
  `Promise.allSettled([queryClient.invalidateQueries(...), revalidateWorksTag()])`,
  `toast.success(...)` e `router.push(...)`.
- `getApiErrorMessage` (`lib/api/auth.client.ts`) já extrai `body.message`
  de qualquer `AxiosError` (400/401/404/409/429 inclusos) de forma genérica
  — não exige tratamento por status code individual na UI, só que o texto
  vindo do backend seja exibido ao usuário.
- Não existe teste de submit em `edit-work-form.test.tsx` hoje (só
  loading/erro de fetch/404/pré-preenchimento com botão desabilitado); esses
  casos existentes precisarão ser atualizados porque o botão deixará de
  nascer desabilitado.

## Escopo da implementação

1. **`lib/api/works.client.ts`**
   - Ajustar `UpdateWorkPayload` para refletir o contrato real confirmado
     no Swagger: `Partial<Pick<CreateWorkPayload, "slug" | "title" |
     "description" | "category" | "tags" | "status">>` (todos opcionais).
     `CreateWorkPayload` já não inclui `images`/`metadata`/`seo`, então não
     há conflito a resolver aí.
   - Implementar `updateWork(workId, payload)` fazendo
     `http.patch<Work>(\`/admin/works/${workId}\`, payload)` e retornando
     `response.data`, seguindo o mesmo padrão de `createWork`/`deleteWork`.
   - Remover o comentário/JSDoc que descreve o bloqueio pela CARSHOP-135.

2. **`edit-work-form.tsx`**
   - Adicionar `handleSubmit`, `isSubmitting` (via `formState`), estado de
     erro de submit (`submitError`), `useRouter`, `useQueryClient`, `toast`
     — mesmo padrão do `CreateWorkForm`.
   - `onSubmit(values: WorkFormOutput)` chama `updateWork(work.id, values)`
     — **path param é `work.id` (UUID), não o `slug`** (conforme Technical
     Notes/contrato real).
   - Em caso de erro: `setSubmitError(getApiErrorMessage(error))`, sem
     navegar.
   - Em caso de sucesso: `Promise.allSettled([queryClient.invalidateQueries
     ({ queryKey: adminWorksQueryKey, refetchType: "none" }),
     revalidateWorksTag()])`, `toast.success(...)`,
     `router.push("/admin/trabalhos")`.
   - Remover `disabled`/`aria-disabled`/`title="Disponível em breve"` do
     botão "Salvar"; usar `disabled={isSubmitting}` e label condicional
     (`"Salvando..."`), igual ao `CreateWorkForm`.
   - Note: o formulário de edição sempre envia todos os campos preenchidos
     (pré-populados), então o `payload` nunca será vazio em uso normal —
     isso já satisfaz `minProperties:1` do contrato sem lógica adicional de
     "enviar só os campos alterados" (fora de escopo desta task; não
     mencionado no DoD).

3. **Testes** (`edit-work-form.test.tsx`)
   - Atualizar o teste existente de pré-preenchimento: o botão "Salvar" não
     nasce mais desabilitado.
   - Adicionar cobertura de submit:
     - sucesso (200): chama `updateWork` com `work.id` e os valores do
       formulário, invalida cache, chama `revalidateWorksTag`, navega para
       `/admin/trabalhos`.
     - erro 400/404/409 (via mock de `getApiErrorMessage`/`updateWork`
       rejeitando): mensagem de erro exibida com `role="alert"`, sem
       navegação.
   - Manter/ajustar mocks de `useForm`/`react-hook-form` conforme
     necessário para exercitar `handleSubmit`.
   - Meta: cobertura ≥80% no código alterado (`works.client.ts` e
     `edit-work-form.tsx`), conforme DoD.

## Fora de escopo

- Qualquer mudança em `images`/`metadata`/`seo` do work (não editáveis por
  este endpoint, conforme contrato).
- Mudança de UX para envio parcial de campos (diff do formulário) — o DoD
  não exige isso; o formulário sempre popula todos os campos.
- Qualquer mudança em `createWork`/`deleteWork`/`getAdminWorks`.

## Conflitos/pontos de atenção a validar com o usuário

Nenhum conflito de escopo identificado entre Description/DoD e o estado
real do repositório: o contrato do Swagger, o path param `workId`, e o
padrão de implementação (`CreateWorkForm`) já existente no repo são
mutuamente consistentes com o que a task pede.

## Classificação de tamanho

**SMALL** — escopo limitado a 2 arquivos de produção
(`lib/api/works.client.ts`, `edit-work-form.tsx`) mais seu arquivo de teste,
seguindo um padrão já estabelecido e comprovado no mesmo repositório
(`CreateWorkForm`/`createWork`). Não há decisão arquitetural nova a tomar
(Server/Client Component, roteamento, contrato de API já confirmados). Plano
formal (`plan-writer`) é opcional.

## Próximos agentes necessários

- `knowledge-reader`: opcional — pode valer a pena checar o vault Obsidian
  por notas de padrão de mutação/PATCH ou lições da CARSHOP-135, mas não é
  bloqueante dado que o padrão já está claro no próprio código
  (`CreateWorkForm`).
- `architect`: **não necessário** — nenhuma decisão de arquitetura, UI ou
  Server/Client Component nova; a tela e o componente já existem e o padrão
  de mutação client-side já está estabelecido.
- `plan-writer`: **não obrigatório** (tarefa SMALL). Pode ser acionado se o
  usuário preferir um plano explícito antes da implementação.
