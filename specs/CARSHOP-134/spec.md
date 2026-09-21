# CARSHOP-134 — Criar página /admin/trabalhos/novo para cadastrar trabalho

## Referência

Tarefa Notion CARSHOP-134 (To Do, Sprint 6, High, Frontend, Admin UI/Works,
Epic Frontend Admin, 3 pontos). Descrição, DoD e Notas Técnicas completas
estão na tarefa; este documento não as duplica, apenas resolve conflitos e
define o escopo executável.

## Conflitos entre Notion e o repositório real (já resolvidos)

1. **Campo `slug`**: o contrato HTTP versionado do backend confirma que
   `POST /works` exige `slug`. O formulário e `CreateWorkPayload` incluem o
   campo, alinhados também à descrição original da tarefa no Notion.
2. **Contrato versionado**: `docs/api-contract.md` do backend é a fonte de
   verdade para `POST /works` e `GET /works?includeDrafts=true`, conforme
   `docs/context/notion.md`.
3. **"Continuar para gerenciamento/upload de imagens" após sucesso**: não
   existe (e não será criada) uma página de edição individual de work. O
   upload/remoção de imagem de um work já existe hoje, implementado inline
   em `app/(admin)/admin/(protected)/work-list-item.tsx`, dentro da própria
   listagem em `/admin`. Portanto, "continuar para gerenciamento de imagens"
   é satisfeito por **redirecionar para `/admin` após o sucesso**, onde a
   listagem autenticada inclui rascunhos e mostra o work recém-criado com os
   controles de imagem já existentes (fora de escopo, CARSHOP-33).

## Escopo incluído

1. Nova rota `app/(admin)/admin/(protected)/trabalhos/novo/page.tsx`.
   Protegida automaticamente pelo layout do grupo `(protected)`
   (`app/(admin)/admin/(protected)/layout.tsx`) — nenhuma lógica de proteção
   adicional é necessária.
2. Novo componente de formulário (ex.:
   `app/(admin)/admin/(protected)/trabalhos/novo/create-work-form.tsx`) usando
   React Hook Form + Zod, seguindo o padrão já estabelecido em
   `app/(admin)/admin/login/page.tsx`:
   - `zodResolver`;
   - normalização com `.trim()` antes da validação de obrigatoriedade;
   - `noValidate` no `<form>`;
   - `aria-invalid` e `aria-describedby` por campo;
   - mensagens de erro de campo em `<p id="...-error">`;
   - erro de submit (API) em `<p role="alert">`;
   - `toast.success(...)` (sonner) em caso de sucesso.
3. Uso de `createWork()` de `lib/api/works.client.ts` (POST `/works` via a
   instância Axios `http`, que já injeta `Authorization: Bearer` e
   `X-CSRF-Token` via interceptor em `lib/api/http.ts` — nada é anexado
   manualmente no formulário).
4. Tratamento de erro via `getApiErrorMessage(error)` de
   `lib/api/auth.client.ts` (mesmo padrão já usado em `create-work-form.tsx`
   atual), cobrindo 400 (validação), 401 (sessão expirada/token inválido) e
   409 (conflito, ex.: duplicidade), sem expor detalhes internos da API.
5. Pós-sucesso: invalidar a query administrativa, tentar
   `revalidateWorksTag()` e navegar para `/admin`. Falhas de sincronização
   de cache não transformam um POST já confirmado em erro de criação.
6. Remoção do formulário inline "Novo work" da página `/admin`:
   - remover a seção `"Novo work"` e `<CreateWorkForm />` de
     `app/(admin)/admin/(protected)/page.tsx`;
   - remover `app/(admin)/admin/(protected)/create-work-form.tsx` e seu
     teste `create-work-form.test.tsx`;
   - adicionar, no lugar, um link/botão "Novo trabalho" apontando para
     `/admin/trabalhos/novo` (usar `next/link` + `Button` com `asChild`,
     padrão já usado no design system do projeto).
7. Testes (Vitest + Testing Library) para o novo formulário, cobrindo:
   - validação client-side (campos obrigatórios vazios não submetem, com
     mensagens de erro exibidas e `aria-invalid`);
   - fluxo de sucesso (submit válido → `createWork` chamado com payload
     correto → `revalidateWorksTag` chamado → navegação para `/admin`);
   - erros 400, 401 e 409 (mensagem amigável exibida via `role="alert"`,
     sem expor corpo bruto da resposta).
   Seguir o modelo de asserts/mocks já usado em
   `app/(admin)/admin/(protected)/create-work-form.test.tsx` (que será
   removido, mas serve de referência de padrão).
8. Ajuste do teste de `page.tsx`
   (`app/(admin)/admin/(protected)/page.test.tsx`) para refletir a remoção
   do formulário inline e a presença do novo link/botão.
9. Listagem administrativa client-side via TanStack Query e
   `getAdminWorks()` (`GET /works?includeDrafts=true`), mantendo
   `getWorks()` exclusivamente público/ISR.

## Escopo explicitamente excluído

- Upload de imagens do work (CARSHOP-33) — já implementado em
  `work-list-item.tsx`, não é tocado nem duplicado por esta tarefa.
- Qualquer página de edição individual de work (`/admin/trabalhos/[id]` ou
  similar) — não existe hoje e não será criada aqui.
- Alterações no backend ou no contrato de `/works`.

## Campos do formulário e validação Zod proposta

Baseado estritamente em `CreateWorkPayload` (`lib/api/works.client.ts`):

```ts
const createWorkSchema = z.object({
  slug: z.string().trim().min(1, "Informe o slug."),
  title: z.string().trim().min(1, "Informe o título."),
  description: z.string().trim().min(1, "Informe a descrição."),
  category: z.string().trim().min(1, "Informe a categoria."),
  tags: z
    .string()
    .min(1, "Informe ao menos uma tag.")
    .transform((value) =>
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    )
    .refine((tags) => tags.length > 0, "Informe ao menos uma tag."),
  status: z.enum(["published", "draft"], {
    required_error: "Selecione o status.",
  }),
});
```

Observações:

- Não existe componente Shadcn/UI de tags/multi-select/combobox instalado
  em `components/ui/` (confirmado: apenas `button`, `dialog`, `card`,
  `input`, `label`, `badge` existem). A UX de tags mantém o padrão já usado
  no formulário atual: um `<Input>` de texto único, tags separadas por
  vírgula, convertidas em array pelo `transform` do Zod acima. Isso evita
  introduzir um componente novo fora do padrão visual já aprovado.
- `status` é renderizado como `<select>` nativo (não há componente `Select`
  do Shadcn/UI instalado); estilização segue o mesmo padrão de classe usado
  no `<textarea>` nativo de `create-work-form.tsx` atual.
- `description` usa `<textarea>` nativo, mesmo padrão do formulário atual.
- Validação client-side não duplica regras de domínio do backend (ex.:
  unicidade de slug/título) — apenas obrigatoriedade e formato básico. Erros
  de negócio (409, etc.) são tratados como erro de submissão vindo da API.

## Contrato de API usado

- `createWork(payload: CreateWorkPayload): Promise<Work>` — POST `/works`,
  `lib/api/works.client.ts`. O payload contém exatamente
  `slug, title, description, category, tags, status`.
- `getAdminWorks(): Promise<Work[]>` — GET
  `/works?includeDrafts=true`, autenticado via Axios/interceptor.
- Autenticação e CSRF são responsabilidade do interceptor Axios em
  `lib/api/http.ts` — o formulário não manipula headers manualmente.

## Arquivos a criar

- `app/(admin)/admin/(protected)/trabalhos/novo/page.tsx`
- `app/(admin)/admin/(protected)/trabalhos/novo/create-work-form.tsx`
- `app/(admin)/admin/(protected)/trabalhos/novo/create-work-form.test.tsx`
- `app/(admin)/admin/(protected)/admin-work-list.tsx`
- `app/(admin)/admin/(protected)/admin-work-list.test.tsx`
- (opcional, se a página tiver lógica própria além de renderizar o
  formulário) `app/(admin)/admin/(protected)/trabalhos/novo/page.test.tsx`

## Arquivos a modificar

- `app/(admin)/admin/(protected)/page.tsx` (remove seção "Novo work",
  adiciona link/botão "Novo trabalho")
- `app/(admin)/admin/(protected)/page.test.tsx` (ajusta expectativas)
- `lib/api/works.client.ts` e `lib/api/works.client.test.ts`
- `app/(admin)/admin/(protected)/work-list-item.tsx` e seu teste

## Arquivos a remover

- `app/(admin)/admin/(protected)/create-work-form.tsx`
- `app/(admin)/admin/(protected)/create-work-form.test.tsx`

## Dependências e riscos

- Dependências (CARSHOP-2, CARSHOP-13, CARSHOP-29, CARSHOP-31) já
  implementadas no código atual — não bloqueiam a execução.
- Risco de regressão no teste de `page.tsx` por causa da remoção do
  formulário inline — mitigado pelo item de "Arquivos a modificar".
- Nenhum segredo, token ou valor real de `.env` é referenciado nesta spec
  (conforme `docs/rules/spec-security.md`).

## Classificação de tamanho

**NON-TRIVIAL**

Justificativa: a tarefa envolve (a) criação de uma rota nova, (b) um
formulário novo completo com React Hook Form + Zod substituindo um padrão
não conformante (`useState` cru), (c) remoção e refatoração de um formulário
existente e da página `/admin`, (d) uma decisão de navegação pós-sucesso que
precisou ser resolvida por investigação de código (não havia página de
edição), e (e) testes cobrindo múltiplos cenários (validação, sucesso,
400/401/409). Múltiplos arquivos e áreas são afetados, com impacto direto na
página `/admin` existente — plano é obrigatório via `plan-writer`.

## Próximos agentes necessários

- `knowledge-reader`: recomendado, para verificar se há notas no Obsidian
  sobre o padrão de formulários admin (RHF+Zod), navegação pós-mutação ou
  decisões anteriores sobre a página `/admin` que possam informar o plano.
- `architect`: necessário, para decidir a estrutura de componente do
  formulário/página, uso de `Button asChild` para o link "Novo trabalho", e
  eventual necessidade de um componente de layout compartilhado entre
  `/admin` e `/admin/trabalhos/novo` (ex.: cabeçalho de seção reutilizável).
- `plan-writer`: obrigatório (tarefa NON-TRIVIAL) — deve persistir
  `plan.md` detalhando a sequência de criação/remoção de arquivos, ordem de
  testes e riscos de regressão na página `/admin`.
