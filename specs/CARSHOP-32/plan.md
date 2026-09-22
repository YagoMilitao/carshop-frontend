# Plano de implementação — CARSHOP-32

Status: NON-TRIVIAL. Plano persistido conforme decisões já aprovadas pelo
`architect` (read-only). Este documento não introduz novas decisões de
arquitetura — apenas sequencia a implementação e documenta riscos/critérios
de aceite.

## Bloqueio confirmado — CARSHOP-135

O submit real de edição (persistência via `PATCH`/update) está **bloqueado**
porque a CARSHOP-135 não define nem documenta um contrato real de update de
`Work` em nenhum lugar do repositório (sem `docs/api-contract.md`, sem
Swagger consultável, sem código de backend disponível). Por regra do
CLAUDE.md ("backend contract rule"), nenhum contrato pode ser inventado.

Decisão já aprovada para contornar o bloqueio sem travar o restante do
escopo: implementar tudo (rota, carregamento por slug, formulário
pré-preenchido, validação, estados de loading/erro/404) **exceto a
persistência real**, isolando a chamada de update atrás de uma função
`updateWork` que lança um erro explicativo referenciando a CARSHOP-135, e
mantendo o botão "Salvar" desabilitado com `title="Disponível em breve"`
(mesmo padrão do botão "Editar" em `work-list-item.tsx` antes desta task).

**Antes de implementar**, confirmar com o usuário que esse sequenciamento
(entregar tudo exceto o submit real, seguindo o padrão de botão desabilitado)
é aceitável para o DoD da CARSHOP-32 tal como está — já que o DoD completo
(Notion) menciona "persistência" e "reflexo dos dados atualizados após
salvar", que **não serão alcançáveis nesta task** enquanto a CARSHOP-135
não for confirmada. Caso o usuário não aceite esse escopo parcial, a
implementação deve parar após esta confirmação.

## Decisões arquiteturais herdadas (resumo, não reabertas aqui)

1. Carregamento por slug no admin reaproveita `getAdminWorks()` (já inclui
   drafts) via `useQuery` + `select`, sem nova chamada HTTP. Função pura
   `findAdminWorkBySlug` extraída em `lib/api/works.client.ts`.
2. Rota dividida em Server Component fino (`page.tsx`, sem fetch, Axios é
   client-only por ADR-001) + Client Component (`edit-work-form.tsx`) que
   concentra `useQuery`/`useForm`/`useRouter`/`useQueryClient`.
3. Schema Zod e subcomponente de campos extraídos de `create-work-form.tsx`
   para módulos compartilhados, reaproveitados por criação e edição sem
   acoplar os fluxos de submit.
4. Update isolado em `updateWork` (lança erro explicando o bloqueio); botão
   "Salvar" nasce desabilitado.
5. Estados: loading simples, erro de fetch com `role="alert"` +
   `getApiErrorMessage`, 401 sem tratamento específico (já coberto
   globalmente), 404 inline dentro do `EditWorkForm` (sem `notFound()`),
   validação já coberta pelo schema compartilhado, conflito de submit não
   aplicável agora.

## Ordem de implementação

1. **Confirmar com o usuário** o sequenciamento do bloqueio da CARSHOP-135
   (ver seção acima) antes de tocar em código.
2. Criar branch `feat/CARSHOP-32` a partir de `master` atualizado.
3. **Extrair schema compartilhado**: criar
   `app/(admin)/admin/(protected)/trabalhos/work-form-schema.ts` com o
   schema Zod (`slug`, `title`, `description`, `category`, `tags`,
   `status`) e os tipos `WorkFormInput`/`WorkFormOutput`, movidos de
   `create-work-form.tsx` sem alterar as regras de validação existentes.
4. **Extrair subcomponente de apresentação**: criar
   `app/(admin)/admin/(protected)/trabalhos/work-form-fields.tsx`
   (`WorkFormFields`), recebendo `register`/`errors` (e o necessário para
   renderizar os mesmos campos/mensagens de erro hoje em
   `create-work-form.tsx`), sem lógica de submit.
5. **Atualizar `create-work-form.tsx`** para importar `workFormSchema` e
   `WorkFormFields` dos novos módulos, mantendo comportamento idêntico.
   Rodar `create-work-form.test.tsx` (existente) e garantir que continua
   passando sem alteração de asserts.
6. **Adicionar em `lib/api/works.client.ts`**:
   - `findAdminWorkBySlug(works: Work[], slug: string): Work | undefined`
     (função pura, sem I/O).
   - `type UpdateWorkPayload = CreateWorkPayload` (comentário indicando
     "a confirmar quando contrato real existir via CARSHOP-135").
   - `async function updateWork(workId: string, payload: UpdateWorkPayload): Promise<Work>`
     que lança `Error` explicando o bloqueio pela CARSHOP-135, sem chamada
     HTTP real.
7. **Criar `mapWorkToFormValues`** (função pura, local ao módulo de edição
   ou junto ao schema compartilhado) convertendo `Work` →
   `WorkFormInput` (tags: `string[]` → `string` via `join(", ")`, demais
   campos 1:1).
8. **Criar `edit-work-form.tsx`** (Client Component):
   - `useQuery({ queryKey: adminWorksQueryKey, queryFn: getAdminWorks, select: (works) => findAdminWorkBySlug(works, slug) })`.
   - Estado de loading (`isPending`) com mensagem simples.
   - Estado de erro de fetch com `role="alert"` + `getApiErrorMessage`,
     seguindo o padrão de `admin-work-list.tsx`.
   - Estado 404 inline (work `undefined` após load bem-sucedido): mensagem
     + link "Voltar para Trabalhos" (`/admin/trabalhos`), sem heading
     concorrente com o `h1` da página.
   - `useForm({ resolver: zodResolver(workFormSchema), values: mapWorkToFormValues(work) })`
     para sincronizar quando o work assíncrono chega.
   - Renderiza `WorkFormFields` com `register`/`errors`.
   - Botão "Salvar" desabilitado, com `title="Disponível em breve"`
     (mesmo padrão de `work-list-item.tsx` antes desta task), mesmo com
     formulário/validação/carregamento totalmente funcionais.
   - Não implementar `onSubmit` chamando `updateWork` neste momento além
     do necessário para o botão permanecer desabilitado (não há handler
     ativo enquanto bloqueado).
9. **Criar `page.tsx`** em
   `app/(admin)/admin/(protected)/trabalhos/[slug]/editar/page.tsx`:
   Server Component fino, `export const metadata` com `robots: { index: false, follow: false }` (padrão noindex de páginas admin), `await params` para
   extrair `slug`, renderiza `<EditWorkForm slug={slug} />` (ou equivalente
   com `h1` da página).
10. **Atualizar `work-list-item.tsx`**: habilitar o botão "Editar",
    envolvê-lo em `Link` do `next/link` apontando para
    `/admin/trabalhos/${work.slug}/editar`, remover `disabled`,
    `aria-disabled` e `title="Disponível em breve"`.
11. **Testes** (ver seção dedicada abaixo).
12. Rodar lint/typecheck/build e subir o dev server localmente para validar
    manualmente o fluxo (loading, 404 com slug inexistente, formulário
    pré-preenchido com um work existente — incluindo um rascunho — e botão
    "Salvar" desabilitado), antes de reportar concluído.

## Arquivos a criar

- `app/(admin)/admin/(protected)/trabalhos/[slug]/editar/page.tsx`
- `app/(admin)/admin/(protected)/trabalhos/[slug]/editar/edit-work-form.tsx`
- `app/(admin)/admin/(protected)/trabalhos/work-form-schema.ts`
- `app/(admin)/admin/(protected)/trabalhos/work-form-fields.tsx`
- Testes correspondentes (ver seção de testes)

## Arquivos a alterar

- `lib/api/works.client.ts` — adicionar `findAdminWorkBySlug`,
  `UpdateWorkPayload`, `updateWork`.
- `app/(admin)/admin/(protected)/trabalhos/novo/create-work-form.tsx` —
  importar schema/campos compartilhados; sem mudança de comportamento.
- `app/(admin)/admin/(protected)/trabalhos/work-list-item.tsx` — habilitar
  botão "Editar" com `Link`.

## Critérios de aceite (mapeados ao DoD da spec, na medida do desbloqueado)

- Rota `/admin/trabalhos/[slug]/editar` acessível a partir do botão
  "Editar" da listagem admin.
- Work carregado corretamente por slug, incluindo rascunhos (`status:
  draft`), sem nova chamada HTTP além de `getAdminWorks` já em cache/query.
- Loading tratado com mensagem simples durante `isPending`.
- 404 tratado inline (slug sem work correspondente na listagem admin),
  com link de retorno para `/admin/trabalhos`.
- 401 não requer tratamento específico nesta task (coberto globalmente).
- Formulário pré-preenchido com os dados reais do work, reaproveitando
  `workFormSchema`/`WorkFormFields` de `create-work-form.tsx`.
- Validação client-side funcional (mesmas regras do schema compartilhado).
- Botão "Salvar" claramente desabilitado com indicação de indisponibilidade
  ("Disponível em breve"), documentando o bloqueio da CARSHOP-135 —
  persistência real e navegação pós-sucesso **ficam fora do DoD alcançável
  nesta task**, a serem retomadas quando a CARSHOP-135 for confirmada.
- `create-work-form.test.tsx` continua passando sem alteração de
  comportamento.
- `work-list-item.tsx`: botão "Editar" navega corretamente para a nova
  rota via `Link`.

## Riscos e pontos de atenção (para tester/reviewer)

- **Botão desabilitado pode parecer feature incompleta** — mitigado por
  texto explicativo; é padrão já aceito no projeto (mesmo usado
  anteriormente em `work-list-item.tsx`). Reviewer deve confirmar que o
  texto/estado comunica claramente o motivo, não apenas um botão inerte.
- **Refatoração de `create-work-form.tsx`** toca arquivo existente com
  teste já aprovado — risco baixo, mas `create-work-form.test.tsx` deve
  ser executado e continuar passando sem qualquer ajuste de asserts (se
  precisar de ajuste, isso é sinal de mudança de comportamento não
  autorizada).
- **404 inline precisa de hierarquia de heading correta**: `h1` deve ficar
  na página (`page.tsx`) ou em posição única dentro de `EditWorkForm`; a
  mensagem de 404 não deve introduzir um heading concorrente.
- **`select` do TanStack Query depende de `getAdminWorks` sem paginação**
  — se paginação for introduzida no futuro, este ponto precisa ser
  revisitado (não é uma ação desta task, apenas um risco documentado).
- **Cobertura de testes**: conforme CLAUDE.md, código novo/alterado deve
  atingir ao menos 80% de cobertura quando aplicável. Sugestões mínimas:
  - `findAdminWorkBySlug`: casos de slug encontrado, não encontrado, lista
    vazia.
  - `updateWork`: garante que lança o erro esperado referenciando a
    CARSHOP-135 e que nenhuma chamada HTTP é disparada (mock de `http`
    não deve ser invocado).
  - `mapWorkToFormValues`: conversão de `tags` (array → string) e demais
    campos 1:1.
  - `edit-work-form.tsx`: renderização em loading, erro de fetch (`role="alert"`),
    404 (work não encontrado, com link de retorno), formulário
    pré-preenchido a partir de um work mockado (incluindo `status: draft`),
    e botão "Salvar" sempre desabilitado com o texto/title esperado.
  - `work-list-item.tsx`: teste atualizado garantindo que o botão "Editar"
    agora é um link ativo apontando para a URL correta (`/admin/trabalhos/{slug}/editar`),
    sem `disabled`/`aria-disabled`.
  - `create-work-form.tsx`: nenhuma alteração de teste esperada além de,
    se necessário, ajuste de imports/mocks decorrentes da extração de
    módulos (sem mudança de asserts de comportamento).
- **Não implementar `onSubmit` real** contra `updateWork` no formulário —
  apenas a função isolada deve existir; o formulário não deve tentar
  chamá-la enquanto o botão estiver desabilitado, para não criar código
  morto/enganoso sobre o estado real do bloqueio.
- **Segurança**: nenhum segredo, token ou valor real de `.env` deve
  aparecer neste plano ou na implementação, conforme
  `docs/rules/spec-security.md`.

## Fora de escopo (reafirmado do spec)

- Implementação do endpoint `PATCH` real no backend.
- Upload/gestão de imagens (já coberto por `work-list-item.tsx`).
- Alteração de `getWorkBySlug` público (`lib/api/works.ts`).
- Navegação pós-sucesso do submit real e invalidação de cache pós-update —
  a serem implementadas quando a CARSHOP-135 for desbloqueada, seguindo o
  padrão já usado em `create-work-form.tsx` (`getApiErrorMessage` +
  `submitError` local, invalidação de `adminWorksQueryKey` +
  `revalidateWorksTag()`, `router.push("/admin/trabalhos")`).
