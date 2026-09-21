# CARSHOP-151 — Implementar redirect-back após login admin

## Referência

Tarefa Notion CARSHOP-151 (Backlog, Sprint 6, Medium, Frontend, Admin
UI/Auth). Descrição, DoD e Notas Técnicas completas estão na tarefa; este
documento não as duplica, apenas resolve conflitos e define o escopo
executável com base no estado real do código.

## Conferência do código real (Notion vs. repositório)

Os 4 arquivos citados nas Notas Técnicas existem e foram lidos
integralmente. Ajustes em relação ao texto do Notion:

1. **`proxy.ts`** (raiz do projeto, não `middleware.ts`) — camada 1, roda no
   Edge. Hoje redireciona via `NextResponse.redirect(new URL("/admin/login",
   request.url))` quando não há cookie `refresh_token`. Tem acesso a
   `request.nextUrl.pathname` e `request.nextUrl.search` (query string
   original), então consegue montar o `redirect` param sem depender de nada
   client-side.
2. **`app/(admin)/admin/(protected)/layout.tsx`** — camada 2, Server
   Component (`dynamic = "force-dynamic"`), roda em toda navegação sob
   `(protected)` exceto `/admin/login`. Hoje usa `redirect("/admin/login")`
   (de `next/navigation`) quando `getSession()` retorna `null`. Não tem
   acesso direto à query string da request atual como prop — precisa dela
   via `props.searchParams` da própria page/layout do Next (Server
   Component recebe `searchParams` apenas em `page.tsx`, não em
   `layout.tsx`). **Ponto de atenção arquitetural**: como este layout não
   recebe `pathname`/`searchParams` nativamente, é preciso decidir a forma
   de obter a rota atual (ex.: `headers()` do Next para ler o pathname via
   header custom setado pelo `proxy.ts`, ou aceitar que, na prática, o
   `proxy.ts` já intercepta antes por rodar em todas as rotas `/admin/:path*`
   e cobre o caso comum). Isso é uma decisão de arquitetura, não de spec —
   encaminhado ao `architect`.
3. **`lib/auth/AuthProvider.tsx`** — Client Component. Hoje, em
   `onAuthFailure` (callback de `lib/api/http.ts`, disparado por 401 do
   Axios), faz `router.push("/admin/login")` sem capturar a rota atual. Para
   capturar a rota atual no client é necessário `usePathname()` (+
   `useSearchParams()`, opcional) de `next/navigation`, hoje não importado
   neste arquivo.
4. **`app/(admin)/admin/login/page.tsx`** — Client Component. Hoje faz
   `router.push("/admin")` fixo após `login()` bem-sucedido, sem ler nenhum
   query param. Precisa ler `redirect`/`callbackUrl` via `useSearchParams()`
   e validar antes de usar como destino do `router.push`.

Nenhum conflito de escopo entre Notion e repositório foi identificado além
do ponto arquitetural do item 2 acima (limitação de `searchParams` em
`layout.tsx`), que é sinalizado ao usuário e ao `architect` antes da
implementação.

## Escopo incluído

1. Definir e centralizar uma função utilitária de validação de redirect
   seguro (ex.: `isSafeInternalRedirect(path: string): boolean` ou
   equivalente), que:
   - aceita apenas caminhos que começam com `/` (path absoluto interno);
   - rejeita URLs absolutas/externas (`http://`, `https://`, `//` — que o
     browser trata como protocol-relative e pode escapar para domínio
     externo);
   - rejeita qualquer valor que não seja uma string simples de rota (evitar
     `javascript:`, backslashes, etc.);
   - local de definição a decidir com o `architect` (ex.: `lib/auth/` por
     ser específico de auth, dado que não há `lib/utils/` estabelecido para
     isso hoje — confirmar estrutura existente).
2. `proxy.ts`: ao redirecionar para `/admin/login` por ausência de
   `refresh_token`, anexar `?redirect=<pathname+search original>` (com
   `encodeURIComponent`), exceto quando a rota original já é `/admin`
   (login "direto" não precisa de `redirect`).
3. `(protected)/layout.tsx`: mesma lógica de redirect-back ao chamar
   `redirect("/admin/login")` quando `getSession()` é `null` — sujeito à
   decisão arquitetural do item 2 acima sobre como obter a rota atual dentro
   de um `layout.tsx` Server Component.
4. `AuthProvider.tsx`: no callback `onAuthFailure`, capturar `pathname`
   (via `usePathname()`) antes de `router.push`, e incluir como
   `?redirect=` na navegação para `/admin/login`.
5. `app/(admin)/admin/login/page.tsx`:
   - ler o param `redirect` via `useSearchParams()`;
   - validar com a função utilitária do item 1;
   - se válido, `router.push(redirect)` após login bem-sucedido; caso
     contrário (ausente ou inválido), manter `router.push("/admin")`
     (comportamento atual).
6. Testes cobrindo:
   - `proxy.ts`: redirect inclui `?redirect=` com a rota original quando
     aplicável; não inclui quando a origem já é `/admin`.
   - `(protected)/layout.tsx`: comportamento equivalente (ajustado à
     decisão arquitetural do item 3).
   - `AuthProvider.tsx`: `onAuthFailure` navega para `/admin/login` com
     `?redirect=<pathname atual>`.
   - `app/(admin)/admin/login/page.tsx`: login com `?redirect=/admin/trabalhos/123`
     válido navega para essa rota; login sem `redirect` navega para
     `/admin`; login com `redirect` malicioso (ex.:
     `?redirect=https://evil.com`, `?redirect=//evil.com`) navega para
     `/admin`, nunca para a URL externa.
   - Função utilitária de validação: casos de rota interna válida, URL
     absoluta, protocol-relative (`//`), string vazia/ausente,
     `javascript:`.

## Escopo explicitamente excluído

- Qualquer mudança no backend/contrato de autenticação (`/auth/login`,
  `/auth/session`, etc.) — o fluxo continua 100% client/edge-side no
  frontend.
- Redirect-back para o fluxo de login público (não-admin), caso exista —
  fora do escopo desta tarefa, que trata exclusivamente do login admin.
- Persistir o destino do redirect em cookie/localStorage — a Nota Técnica
  aponta explicitamente query param.

## Contrato/nome do query param

A Nota Técnica sugere `redirect` ou `callbackUrl` sem decidir. Esta spec
adota `redirect` como nome padrão (mais curto, sem conotação de biblioteca
externa como NextAuth), a confirmar/ajustar pelo `architect` caso haja
preferência de padronização.

## Arquivos a modificar

- `proxy.ts`
- `app/(admin)/admin/(protected)/layout.tsx`
- `lib/auth/AuthProvider.tsx`
- `app/(admin)/admin/login/page.tsx`
- Testes correspondentes a cada um dos arquivos acima (existentes ou novos,
  a confirmar contra os arquivos `*.test.ts(x)` já presentes no repositório)

## Arquivos a criar

- Módulo utilitário de validação de redirect seguro (local exato definido
  pelo `architect`) e seu teste unitário.

## Dependências e riscos

- Risco de open redirect se a validação da função utilitária for
  incompleta (ex.: não cobrir `//evil.com` como protocol-relative) — DoD
  exige explicitamente essa proteção, então a cobertura de testes deve
  incluir esse caso.
- Risco arquitetural pontual: `layout.tsx` (Server Component) não recebe
  `searchParams`/`pathname` nativamente como uma `page.tsx` recebe — decisão
  de como obter a rota atual ali é necessária antes da implementação
  (encaminhado ao `architect`).
- Nenhum segredo, token ou valor real de `.env` é referenciado nesta spec
  (conforme `docs/rules/spec-security.md`).

## Classificação de tamanho

**NON-TRIVIAL**

Justificativa: a tarefa toca 4 arquivos em 3 camadas arquiteturais
diferentes do fluxo de autenticação (Edge middleware, Server Component de
proteção de rota, Client Provider de contexto, página de login), exige
criar um novo módulo utilitário compartilhado de validação de segurança
(proteção contra open redirect, exigida explicitamente pelo DoD), e envolve
pelo menos uma decisão arquitetural não trivial (como obter a rota atual
dentro de um `layout.tsx` Server Component, que não recebe `searchParams`
nativamente). Plano é obrigatório via `plan-writer`.

## Próximos agentes necessários

- `knowledge-reader`: recomendado, para verificar se há notas no Obsidian
  sobre o padrão de proteção de rotas admin (`proxy.ts` + `(protected)/layout.tsx`),
  decisões anteriores sobre `AuthProvider` ou precedentes de
  validação de redirect/segurança no projeto.
- `architect`: necessário, para decidir (a) o local do módulo utilitário de
  validação de redirect, (b) como o `(protected)/layout.tsx` obtém a rota
  atual dado que `layout.tsx` não recebe `searchParams` nativamente, e (c) o
  nome final do query param (`redirect` vs. `callbackUrl`).
- `plan-writer`: obrigatório (tarefa NON-TRIVIAL) — deve persistir
  `plan.md` detalhando a ordem de implementação entre as 3 camadas, a
  função utilitária compartilhada e a sequência de testes.
