# CARSHOP-132 — Plano de implementação

Baseado na decisão do `architect` (ver spec em `specs/CARSHOP-132/spec.md`
para o levantamento de contexto e o conflito de escopo original). Este
plano reflete apenas decisões já tomadas pelo `architect`; nenhuma
decisão arquitetural nova é introduzida aqui.

## 0. Pré-requisito / bloqueio já resolvido

- O `spec-writer` havia flagado a ausência de biblioteca de toast como
  bloqueio. **O usuário já resolveu esse bloqueio**: a lib escolhida é
  `sonner`.
- Antes de qualquer alteração de código, o `developer` deve instalar a
  dependência:
  ```
  npm install sonner
  ```
  Confirmar que a instalação foi bem-sucedida e que `sonner` aparece em
  `package.json` (`dependencies`) antes de seguir para o passo 1.

## Ordem de implementação

### 1. `lib/api/errors.ts` (novo)

- Classe `HttpError extends Error` com propriedade `status: number`.
- Usada para substituir os `throw new Error(...)` genéricos atuais em
  `lib/api/works.ts` e `lib/api/comments.ts`.

### 2. `lib/api/retry.ts` (novo)

- Utilitário `withRetryBackoff<T>(operation: () => Promise<T>, options?)`.
- Agnóstico de transporte: recebe uma função (`() => Promise<T>`) e
  apenas a re-executa com backoff exponencial em caso de falha — não
  importa `fetch`, `axios`, nem `server-only`. Isso preserva a fronteira
  do ADR-001 (quem chama decide se é contexto `fetch` server-side ou
  outro), já que o utilitário em si não sabe qual transporte está sendo
  usado.
- Assinatura de `options`: `{ retries?: number; baseDelayMs?: number; maxDelayMs?: number; shouldRetry?: (error: unknown) => boolean }`.
- Defaults sugeridos: `retries = 4`, `baseDelayMs = 500`, `maxDelayMs = 8000`.
- `shouldRetry` default: repetir em erro de rede (ex. `TypeError`/timeout
  do `fetch` rejeitado) e em `HttpError` com `status >= 500` ou
  `status === 429`; não repetir em outros 4xx.
- Cobrir com teste unitário (`lib/api/retry.test.ts`) os casos: sucesso
  na primeira tentativa, sucesso após N falhas, esgotamento de tentativas
  lançando o último erro, e respeito ao `shouldRetry` customizado.

### 3. Alterar `lib/api/works.ts`

- Envolver o `fetch` de `getWorks()` com `withRetryBackoff`.
- Ao receber `!response.ok`, lançar `HttpError` (em vez de `Error`
  genérico) com o `status` da resposta, para que `shouldRetry` do passo 2
  consiga diferenciar 5xx/429 de outros 4xx.
- `getWorkBySlug()` não precisa de tratamento próprio — já reaproveita
  `getWorks()`.
- Atualizar/estender `lib/api/works.test.ts` para cobrir o novo
  comportamento de retry e o novo tipo de erro lançado.

### 4. Alterar `lib/api/comments.ts`

- Mesmo tratamento do passo 3: envolver o fetch com `withRetryBackoff` e
  lançar `HttpError` no lugar de `Error` genérico.
- Atualizar `lib/api/comments.test.ts` de forma equivalente.

### 5. Novo `components/feedback/error-toast.tsx`

- Client Component (`"use client"`) mínimo, props `{ message: string }`.
- Em `useEffect` no mount, dispara `toast.error(message)` do `sonner`.
- Usado para falhas degradáveis (ex. comentários) sem acionar o
  `error.tsx` de toda a rota.
- Testar com um teste de componente simples (`error-toast.test.tsx`)
  verificando que `toast.error` é chamado com a mensagem recebida
  (mockando `sonner`).

### 6. Alterar `app/(public)/portfolio/[slug]/page.tsx`

- `generateStaticParams`: envolver a chamada a `getWorks()` em
  try/catch. Em caso de erro (mesmo após os retries internos do passo 3
  se esgotarem), `console.error(...)` + `return []`. Isso é um fallback
  gracioso de build-time — não quebra `next build`; como `dynamicParams`
  permanece no padrão (`true`), os slugs não pré-gerados continuam
  acessíveis via SSR on-demand.
- `generateMetadata` e o corpo de `ProjectDetailsPage` (chamada a
  `getWorkBySlug`): **não** engolir o erro — deixar propagar (sem
  try/catch), para que o Next capture e renderize o `error.tsx` do
  segmento (passo 7).
- Chamada a `getWorkComments(work.id)` no corpo da página: try/catch
  **local**, pois comentário é dado secundário/degradável. Em erro,
  usar `comments = []` e renderizar `<ErrorToast message="..." />`
  (mensagem em pt-BR, ex.: "Não foi possível carregar os comentários
  agora. Tente novamente mais tarde.").
- Atualizar `app/(public)/portfolio/[slug]/page.test.tsx` cobrindo:
  fallback de `generateStaticParams` em erro, propagação de erro de
  `getWorkBySlug` (não capturado), e renderização de `ErrorToast` quando
  `getWorkComments` falha.

### 7. Novo `app/(public)/portfolio/[slug]/error.tsx`

- Client Component (`"use client"`, obrigatório por convenção do
  Next.js para arquivos `error.tsx`).
- Recebe `{ error, reset }` conforme contrato do Next.
- Em `useEffect` no mount, dispara `toast.error(...)` (sonner) com
  mensagem amigável em pt-BR (ex.: "Não foi possível carregar este
  projeto agora. Tente novamente em alguns instantes.").
- Renderiza UI de fallback (mensagem + botão "Tentar novamente" que
  chama `reset()`).

### 8. Novo `app/(public)/portfolio/error.tsx`

- Mesmo padrão do passo 7, para a página de listagem
  (`app/(public)/portfolio/page.tsx`, que também chama `getWorks()` em
  runtime e pode propagar erro após esgotar os retries).

### 9. Alterar `app/sitemap.ts`

- Aplicar o mesmo fallback gracioso de build-time do passo 6: envolver
  a chamada a `getWorks()` em try/catch → em erro, `console.error(...)` +
  array vazio, para não quebrar `next build`.
- Atualizar o teste correspondente (se existir) para cobrir esse
  cenário.

### 10. Alterar `app/layout.tsx`

- Adicionar `<Toaster richColors position="..." />` (do `sonner`) como
  irmão de `<Providers>{children}</Providers>`, dentro de `<body>`.
- `app/layout.tsx` continua Server Component — não precisa `"use
  client"` (o `Toaster` do sonner já é Client Component internamente).
- Definir a posição do `Toaster` (`position`) seguindo o padrão visual
  já usado no restante da UI (a decidir pelo `developer` dentro da
  liberdade de detalhe visual, sem introduzir nova decisão de
  arquitetura).

## Fora de escopo nesta tarefa (flagar, não implementar)

- Estender retry a `lib/api/http.ts` (instância Axios client-side) —
  não foi decidido pelo `architect` nesta tarefa; requer confirmação de
  escopo futura. **Não tocar em `lib/api/http.ts` ou
  `lib/api/works.client.ts`/`comments.client.ts` nesta tarefa.**

## Critérios de verificação (DoD)

1. **Retry com backoff**: `lib/api/works.test.ts` e
   `lib/api/comments.test.ts` cobrem que uma falha de rede/5xx/429
   dispara múltiplas tentativas antes de lançar `HttpError`; erros 4xx
   (exceto 429) não são repetidos.
2. **Toast em runtime após esgotar tentativas**: com o backend
   indisponível (simulado, ex. apontando `NEXT_PUBLIC_API_URL`/
   `serverEnv.apiUrl` para um endpoint que sempre falha, ou via mock nos
   testes), navegar para `/portfolio` ou `/portfolio/[slug]` deve
   renderizar o `error.tsx` correspondente com `toast.error(...)`
   disparado; navegar para um work existente com comentários
   indisponíveis deve renderizar a página normalmente com
   `<ErrorToast />` disparando o toast (comentários vazios, sem quebrar
   a página).
3. **Build-time degrada graciosamente**: com o backend indisponível
   durante o build, `generateStaticParams` (em
   `app/(public)/portfolio/[slug]/page.tsx`) e `app/sitemap.ts` retornam
   fallback vazio (`[]`) em vez de lançar exceção — validar via teste
   unitário mockando `getWorks()` para rejeitar.
4. **`npm run build` passa com backend indisponível** (validação manual
   obrigatória antes de considerar a tarefa concluída): apontar
   temporariamente a variável de ambiente da API (`NEXT_PUBLIC_API_URL`/
   equivalente server-side) para um host inválido ou indisponível (sem
   usar valores reais de produção/segredos — ex. `http://localhost:9`,
   uma porta fechada localmente) e rodar `npm run build`. O build deve
   completar com sucesso, exibindo apenas os `console.error` esperados
   de `generateStaticParams`/`sitemap.ts` no log, sem falhar o processo.
5. Suíte de testes completa (`npm run test` ou equivalente configurado)
   passa, incluindo os novos/atualizados arquivos de teste listados nos
   passos 2–6 e 9.
6. Nenhum uso de `any`, `@ts-ignore`/`@ts-expect-error` ou cast inseguro
   introduzido (regra de TypeScript estrito do projeto).
7. Nenhum valor real de `.env`/segredo incluído em código, testes ou
   commits (apenas hosts inválidos/locais para simulação de
   indisponibilidade).
