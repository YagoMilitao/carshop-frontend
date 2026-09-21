# CARSHOP-134 — Plano de implementação

Consolida as decisões do `architect` para a spec em `specs/CARSHOP-134/spec.md`.
Não introduz decisões novas de arquitetura; apenas ordena a execução.

Nenhum passo deste plano expõe segredos, tokens ou valores reais de `.env`
(conforme `docs/rules/spec-security.md`).

## Bloqueios a confirmar antes de implementar

Nenhum bloqueio de dependência ou conflito arquitetural foi sinalizado pelo
`architect` para esta tarefa. As dependências (CARSHOP-2, CARSHOP-13,
CARSHOP-29, CARSHOP-31) já estão implementadas no repositório. Implementação
pode prosseguir sem confirmação adicional do usuário.

## Checklist de implementação

### 1. Criar a nova rota `/admin/trabalhos/novo`

- [ ] Criar `app/(admin)/admin/(protected)/trabalhos/novo/page.tsx`:
  - Server Component (sem `"use client"`).
  - `export const metadata: Metadata = { robots: { index: false, follow: false } }`
    (mesmo padrão de `app/(admin)/admin/(protected)/page.tsx:13-18`).
  - Layout estático: `<PageSection as="main" spacing="compact" container="none">`
    envolvendo `<Container variant="reading" className="flex flex-col gap-10">`.
  - `<h1 className="text-heading-2 text-foreground">Novo trabalho</h1>`.
  - Renderiza `<CreateWorkForm />` (import local, do mesmo diretório).
  - Rota é protegida automaticamente por herdar
    `app/(admin)/admin/(protected)/layout.tsx` — nenhuma lógica de proteção
    adicional nesta página.

### 2. Criar o formulário com React Hook Form + Zod

- [ ] Criar `app/(admin)/admin/(protected)/trabalhos/novo/create-work-form.tsx`:
  - `"use client"` no topo.
  - Schema Zod no topo do arquivo (colocation, padrão de
    `app/(admin)/admin/login/page.tsx`), equivalente ao definido na spec
    (seção "Campos do formulário e validação Zod proposta"):
    `title` (obrigatório, `max(120)` — limite real confirmado no backend),
    `description` (obrigatório, `max(5000)` — limite real confirmado no
    backend), `category` (obrigatório), `tags` (`string` único separado por
    vírgula, `.transform()` para `string[]`, `.refine()` garantindo ao menos
    uma tag), `status` (`z.enum(["published", "draft"])`).
  - `useForm` com `zodResolver(createWorkSchema)`; `defaultValues.status = "draft"`.
  - `<form noValidate>`; cada campo com `aria-invalid` e
    `aria-describedby` apontando para `<p id="...-error">` quando houver erro
    (padrão de `app/(admin)/admin/login/page.tsx`).
  - Campos: `title` e `category` via `<Input>` (Shadcn); `description` via
    `<textarea>` nativo (mesma classe usada em
    `create-work-form.tsx:80` atual); `tags` via `<Input>` texto único; `status`
    via `<select>` nativo estilizado com a mesma classe do `<textarea>`
    (conforme decisão do architect — não há `Select` do Shadcn/UI instalado).
  - Submit: chama `createWork(payload)` de `lib/api/works.client.ts` — nenhum
    header manual (Bearer/CSRF já injetados pelo interceptor Axios em
    `lib/api/http.ts`).
  - Erro de submit: capturado com `getApiErrorMessage(error)` de
    `lib/api/auth.client.ts`, exibido em `<p role="alert">`, cobrindo 400,
    401 e 409 sem vazar corpo bruto da resposta.
  - Sucesso: `await revalidateWorksTag()` (Server Action existente,
    importada de `../../../actions.ts`, mesma usada hoje em
    `create-work-form.tsx` e `work-list-item.tsx`), depois
    `router.push("/admin")` (ou `redirect`, conforme padrão já em uso no
    projeto para navegação client-side pós-mutação). Não usar Server Action
    como proxy do backend — `createWork()` continua sendo chamada
    diretamente do cliente via Axios.
  - Opcional: `toast.success(...)` (sonner) antes/durante a navegação, como
    já ocorre em outros fluxos admin (ex.: login).

### 3. Testes do novo formulário

- [ ] Criar `app/(admin)/admin/(protected)/trabalhos/novo/create-work-form.test.tsx`
  (Vitest + Testing Library), usando como modelo de mocks/asserts o teste
  atual `app/(admin)/admin/(protected)/create-work-form.test.tsx` (antes de
  removê-lo), cobrindo:
  - validação client-side: campos obrigatórios vazios não submetem;
    mensagens de erro e `aria-invalid` exibidos;
  - fluxo de sucesso: submit válido → `createWork` chamado com o payload
    correto (incluindo `tags` já transformado em array) → `revalidateWorksTag`
    chamado → navegação para `/admin`;
  - erros 400, 401 e 409: mensagem amigável exibida via `role="alert"`, sem
    expor detalhes internos da resposta da API.
- [ ] (Opcional, apenas se a `page.tsx` da nova rota tiver lógica além de
  renderizar o formulário) Criar
  `app/(admin)/admin/(protected)/trabalhos/novo/page.test.tsx`.

### 4. Remover o formulário inline antigo

- [ ] Remover `app/(admin)/admin/(protected)/create-work-form.tsx`.
- [ ] Remover `app/(admin)/admin/(protected)/create-work-form.test.tsx`.

### 5. Atualizar a página `/admin`

- [ ] Editar `app/(admin)/admin/(protected)/page.tsx`:
  - remover o `import { CreateWorkForm } from "./create-work-form"`;
  - remover a `<section>` "Novo work" (linhas 28-33 atuais) que renderiza
    `<CreateWorkForm />`;
  - adicionar, no lugar (ou em posição equivalente na página), um botão/link:
    `<Button asChild><Link href="/admin/trabalhos/novo">Novo trabalho</Link></Button>`
    (import de `next/link` e do `Button` Shadcn já usado no projeto).
- [ ] Ajustar `app/(admin)/admin/(protected)/page.test.tsx` para refletir a
  remoção do formulário inline e a presença do novo link/botão "Novo
  trabalho" apontando para `/admin/trabalhos/novo`.

### 6. Validação final (checagem cruzada com a spec/DoD)

- [ ] Rota `/admin/trabalhos/novo` protegida via herança do layout
  `(protected)` (sem lógica de proteção duplicada).
- [ ] Formulário usa exatamente os campos do contrato real
  (`title, description, category, tags, status`), sem `slug` e sem campos
  inventados.
- [ ] Nenhum header de autenticação/CSRF é anexado manualmente no
  formulário.
- [ ] Sucesso cria um work real, invalida o cache via `revalidateWorksTag()`
  e redireciona para `/admin`, onde o work aparece na listagem com upload de
  imagem já disponível (fora de escopo, CARSHOP-33).
- [ ] Erros 400/401/409 tratados com mensagens amigáveis, sem vazar detalhes
  internos.
- [ ] Testes cobrindo validação, sucesso e os três cenários de erro
  (400/401/409).
- [ ] Nenhuma duplicação do fluxo de upload de imagens (que permanece
  apenas em `work-list-item.tsx`).
- [ ] Nenhum campo, endpoint ou valor de `.env` inventado; nenhum segredo
  exposto em código, comentários ou testes.

## Ordem de execução recomendada

1. Passo 1 (rota nova) e Passo 2 (formulário) — podem ser feitos juntos,
   pois a página depende do formulário.
2. Passo 3 (testes do novo formulário) — validar o formulário antes de
   tocar na página `/admin`, reduzindo risco de regressão simultânea.
3. Passo 5 (atualizar `page.tsx` e seu teste) — feito com o novo formulário
   já validado, minimizando o tempo em que `/admin` fica sem cobertura de
   teste.
4. Passo 4 (remover arquivos antigos) — por último, só depois que a nova
   rota e o novo formulário estiverem funcionando e testados, e a página
   `/admin` já não referenciar mais `CreateWorkForm` antigo.
5. Passo 6 (validação final) — checklist de fechamento para `tester` e
   `reviewer`.

## Escopo explicitamente fora deste plano

- Upload de imagens de work (CARSHOP-33).
- Página de edição individual de work (`/admin/trabalhos/[id]` ou similar).
- Campo `slug` no formulário.
- Qualquer alteração no contrato real de `/works`
  (`lib/api/works.ts`, `lib/api/works.client.ts`).
