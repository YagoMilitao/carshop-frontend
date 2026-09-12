# CARSHOP-132 — Retry e feedback visual quando o backend estiver indisponível

## Referência

Task Tracker (Notion): `CARSHOP-132`. Descrição, DoD e Technical Notes
completos devem ser consultados lá — este spec resume apenas o que é
relevante para a implementação e não duplica o conteúdo integral.

## Contexto confirmado no repositório

- `lib/api/works.ts` e `lib/api/comments.ts` (Server Components, `fetch`
  nativo, `import "server-only"`) tratam apenas resposta HTTP não-ok
  (`if (!response.ok) throw ...`). Não há `try/catch` para falha de
  conexão (`ECONNREFUSED`, timeout, DNS etc.) em nenhum dos dois.
- `app/(public)/portfolio/[slug]/page.tsx` chama `getWorks()` em
  `generateStaticParams` e `getWorkBySlug()`/`getWorks()` em
  `generateMetadata` e no componente de página — os três caminhos
  propagam a mesma falha de rede sem tratamento.
- `lib/api/http.ts` é a única instância Axios client-side (ADR-001) e já
  tem um interceptor de retry, mas **apenas para refresh de token em
  401** — não existe retry genérico para falha de rede/backend
  indisponível.
- `lib/api/works.client.ts` (mutações admin) usa essa instância Axios.
- **Não existe** nenhum utilitário de retry/backoff genérico no projeto
  (busca por `retry` no código-fonte só retorna resultados em
  `node_modules`).
- **Não existe nenhum componente de toast instalado** (`sonner`,
  `@radix-ui/react-toast`, etc. não constam em `package.json`;
  `components/ui/` só tem `button.tsx` e `dialog.tsx`). Isso é um
  **bloqueio/dependência a ser confirmada com o usuário antes da
  implementação**, e não algo a assumir ou substituir por código
  fictício, conforme `CLAUDE.md`.
- Outros pontos com `generateStaticParams`/mesmo padrão de fetch:
  apenas `app/(public)/portfolio/[slug]/page.tsx` foi encontrado hoje.
  `lib/api/comments.ts` (`getWorkComments`, usado na mesma página, e
  potencialmente em outras) sofre do mesmo problema e deveria receber o
  mesmo padrão de retry para consistência.

## Conflito a flagar ao usuário (antes de implementar)

O DoD pede "feedback visual (toast) ao usuário" em runtime, mas o
projeto **não tem nenhum componente de toast configurado**. Isso é uma
decisão de escopo/dependência que não deve ser resolvida
unilateralmente: será necessário instalar e configurar um componente de
toast (ex.: `sonner`, já usado por convenção em projetos Shadcn/UI) antes
de o `developer` poder atender a esse critério do DoD. Recomendação:
confirmar com o usuário qual biblioteca de toast usar (ou se já há uma
decisão registrada em Obsidian/ADR que o `knowledge-reader` deva
verificar) antes de avançar para a implementação.

## Objetivo

Evitar que falhas de conexão com o backend (`https://carshop-backend-htag.onrender.com`,
via `NEXT_PUBLIC_API_URL`) quebrem o build de produção ou degradem a
experiência do usuário em runtime sem feedback, adicionando retry com
backoff nas chamadas HTTP e um fallback gracioso específico para
build-time.

## Arquivos afetados (esperado)

- `lib/api/works.ts` — `getWorks()`, `getWorkBySlug()`: adicionar
  try/catch de erro de rede + retry com backoff no `fetch`.
- `lib/api/comments.ts` — `getWorkComments()`: mesmo tratamento, por
  consistência.
- `app/(public)/portfolio/[slug]/page.tsx` — `generateStaticParams`:
  fallback gracioso (array vazio de slugs) quando `getWorks()` falhar
  mesmo após retries, para não travar `npm run build`.
- `lib/api/http.ts` — extensão do interceptor de resposta Axios (ou novo
  interceptor dedicado) para retry com backoff em falhas de rede/5xx,
  diferente do interceptor de 401 já existente.
- Novo utilitário compartilhado de retry/backoff (local a decidir pelo
  `architect` — ex. `lib/api/retry.ts` ou `lib/utils/retry.ts`), usado
  tanto pelo `fetch` server-side quanto pelo Axios client-side, para não
  duplicar a lógica de backoff.
- Componente/Provider de toast (novo, dependendo da decisão sobre a
  biblioteca) + ponto(s) de disparo em Client Components que consomem
  dados via `http` (Axios) quando o retry se esgota.
- Possível novo arquivo de configuração se a lib de toast escolhida
  exigir um Provider no layout (`app/layout.tsx` ou equivalente) — a
  decidir pelo `architect`.

## Comportamento esperado

### Build-time (`generateStaticParams`, SSG)

- `getWorks()` tenta novamente (retry com backoff) um número limitado de
  vezes diante de erro de rede.
- Se todas as tentativas falharem, **não deve lançar exceção que quebre
  o build**: `generateStaticParams` deve degradar graciosamente (ex.:
  retornar `[]`), permitindo que `npm run build` complete mesmo com o
  backend fora do ar. Não há toast em build-time (não faz sentido nesse
  contexto).
- `generateMetadata` e o corpo de `ProjectDetailsPage`, quando o slug não
  foi pré-gerado por causa da falha de build, continuam funcionando via
  runtime SSR normal (respeitando o comportamento em runtime abaixo).

### Runtime (Server Components/requests normais e chamadas client-side)

- Chamadas que falharem por rede/backend indisponível fazem retry com
  backoff antes de desistir.
- Após esgotar as tentativas, o usuário recebe feedback visual (toast)
  informando indisponibilidade — aplicável a fluxos client-side (Axios,
  `lib/api/http.ts`/`works.client.ts`) onde há um componente React vivo
  para disparar o toast. Para Server Components que ainda falharem após
  o retry, o comportamento de fallback (ex. página de erro,
  `notFound()`, estado vazio) deve ser definido pelo `architect`/
  `plan-writer`, já que Server Components não podem disparar toasts
  diretamente.

## Critérios de aceite (DoD, replicado do Notion)

1. Retry com backoff implementado nas chamadas à API que podem falhar
   por backend indisponível/lento.
2. Após tentativas consideráveis sem sucesso, feedback visual (toast) é
   exibido ao usuário em runtime.
3. Build-time (`generateStaticParams`) degrada graciosamente sem travar
   o build quando o backend não responde.
4. `npm run build` passa mesmo com o backend fora do ar.

## Classificação de tamanho: **NON-TRIVIAL**

Justificativa:

- Toca múltiplas camadas com padrões de acesso a dados distintos e
  arquiteturalmente segregados por ADR-001 (`fetch` server-side vs.
  instância única Axios client-side) — a estratégia de retry precisa ser
  coerente entre as duas sem violar essa fronteira.
- Envolve pelo menos 4-5 arquivos de código (`lib/api/works.ts`,
  `lib/api/comments.ts`, `lib/api/http.ts`, o `page.tsx` de portfólio, e
  um novo utilitário de retry compartilhado), além de um possível novo
  Provider/componente de toast.
- Há uma decisão de escopo/dependência pendente (biblioteca de toast
  ainda não instalada) que precisa de confirmação do usuário e possível
  decisão arquitetural (onde o Provider de toast entra na árvore de
  Server/Client Components).
- Diferença de comportamento exigida entre build-time e runtime (fallback
  silencioso vs. feedback visual) é uma decisão de design que se
  beneficia de um plano formal antes da implementação.

## Próximos agentes necessários

- `knowledge-reader`: verificar se há ADR/nota em Obsidian sobre
  estratégia de retry, resiliência a cold start do Render, ou decisão
  prévia sobre biblioteca de toast/notificação.
- `architect`: decidir (a) onde vive o utilitário de retry/backoff
  compartilhado e como ele respeita a fronteira `fetch` (server) vs.
  Axios (client) do ADR-001; (b) qual biblioteca de toast usar e onde o
  respectivo Provider entra na árvore de componentes; (c) o fallback de
  runtime para Server Components que falharem após o retry.
- `plan-writer`: plano obrigatório (tarefa NON-TRIVIAL), cobrindo a
  sequência de implementação nos arquivos listados acima e a resolução
  da dependência de toast antes do `developer` iniciar.
