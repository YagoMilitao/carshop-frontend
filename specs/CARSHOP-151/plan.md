# CARSHOP-151 — Plano de implementação

Consolida as decisões do `architect` para a spec em
`specs/CARSHOP-151/spec.md`. Não introduz decisões novas de arquitetura;
apenas ordena a execução.

Nenhum passo deste plano expõe segredos, tokens ou valores reais de `.env`
(conforme `docs/rules/spec-security.md`).

## Bloqueios a confirmar antes de implementar

Nenhum bloqueio de dependência foi sinalizado pelo `architect`. O ponto
arquitetural levantado na spec (como `(protected)/layout.tsx` obtém a rota
atual, já que `layout.tsx` não recebe `searchParams` nativamente) já foi
resolvido pela decisão acima (propagação via headers custom setados no
`proxy.ts` e lidos com `headers()`). Implementação pode prosseguir sem
confirmação adicional do usuário.

## Checklist de implementação

### 1. Criar o módulo isomórfico `lib/auth/redirect.ts`

- [ ] Criar `lib/auth/redirect.ts` — arquivo puro, sem `"use client"` nem
  `"server-only"`, usando apenas Web APIs globais (`URL`,
  `URLSearchParams`), para ser importável tanto em Edge (`proxy.ts`) quanto
  em Server Component (`layout.tsx`) e Client Component (`AuthProvider.tsx`,
  `login/page.tsx`) sem conflito de runtime.
- [ ] Exportar as constantes:
  - `REDIRECT_QUERY_PARAM = "redirect"`
  - `LOGIN_PATH = "/admin/login"`
  - `DEFAULT_ADMIN_PATH = "/admin"`
  - `REDIRECT_PATHNAME_HEADER = "x-carshop-pathname"`
  - `REDIRECT_SEARCH_HEADER = "x-carshop-search"`
- [ ] Implementar `isSafeInternalRedirectPath(candidate: unknown): candidate is string`:
  - `false` se `candidate` não for `string` ou for string vazia;
  - `false` se não começar com `/`;
  - `false` se começar com `//` ou `/\` (protocol-relative / backslash
    escape);
  - `false` se contiver whitespace ou caracteres de controle;
  - validar via `new URL(candidate, "http://internal.local")` e confirmar
    que `url.origin === "http://internal.local"`; qualquer exceção do
    `URL` constructor também retorna `false`;
  - tratar `candidate` como valor opaco — nunca decodificar/reconstruir a
    query string a partir da `URL` parseada, apenas usar o `candidate`
    original como retorno/destino.
- [ ] Implementar `buildLoginRedirectTarget(pathname: string, search？: string): string | null`:
  - monta o candidato a partir de `pathname` (+ `search`, se houver e não
    vazio);
  - retorna `null` se `pathname === DEFAULT_ADMIN_PATH`;
  - retorna `null` se o candidato não passar em
    `isSafeInternalRedirectPath`;
  - caso contrário, retorna o candidato (pathname + search).
- [ ] Implementar `buildLoginUrlWithRedirect(pathname: string, search?: string): string`:
  - chama `buildLoginRedirectTarget`;
  - se `target` for `null`, retorna apenas `LOGIN_PATH`;
  - caso contrário, monta `${LOGIN_PATH}?${REDIRECT_QUERY_PARAM}=<target>`
    usando `URLSearchParams` (nunca concatenação manual de string) para
    garantir `encodeURIComponent` correto.

### 2. Testes do módulo `lib/auth/redirect.ts`

- [ ] Criar `lib/auth/redirect.test.ts` (Vitest), cobrindo
  `isSafeInternalRedirectPath` — não-negociável, é o único vetor real de
  proteção contra open redirect:
  - rota interna válida (ex.: `/admin/trabalhos/123`) → `true`;
  - rota interna com query string (ex.: `/admin/trabalhos/123?tab=fotos`) →
    `true`;
  - URL absoluta (`https://evil.com`, `http://evil.com`) → `false`;
  - protocol-relative (`//evil.com`) → `false`;
  - backslash (`/\evil.com`, `/\/evil.com`) → `false`;
  - string vazia → `false`;
  - `undefined`/`null`/valor não-string → `false`;
  - `javascript:alert(1)` → `false`;
  - string com whitespace/caracteres de controle → `false`.
- [ ] Cobrir `buildLoginRedirectTarget`:
  - `pathname === "/admin"` → `null` (mesmo com `search` presente);
  - `pathname` inseguro → `null`;
  - `pathname` seguro com e sem `search` → retorna o valor esperado.
- [ ] Cobrir `buildLoginUrlWithRedirect`:
  - target `null` → retorna exatamente `LOGIN_PATH` (sem `?`);
  - target válido → retorna `LOGIN_PATH?redirect=<encoded>` com o valor
    corretamente `encodeURIComponent`-ado (incluir um caso com caracteres
    especiais na query, ex. `&`, para confirmar o encoding).

### 3. `proxy.ts` — propagação de headers e redirect com `?redirect=`

- [ ] Editar `proxy.ts`:
  - construir `requestHeaders = new Headers(request.headers)` logo no
    início da função (nunca confiar em headers vindos do client — sempre
    sobrescrever, nunca ler `x-carshop-pathname`/`x-carshop-search` de
    `request.headers` como entrada);
  - `requestHeaders.set(REDIRECT_PATHNAME_HEADER, request.nextUrl.pathname)`
    e `requestHeaders.set(REDIRECT_SEARCH_HEADER, request.nextUrl.search)`
    incondicionalmente, **antes de qualquer `return`**, inclusive no
    early-return atual de `pathname === "/admin/login"`;
  - no branch de `pathname === "/admin/login"`: retornar
    `NextResponse.next({ request: { headers: requestHeaders } })` no lugar
    do `NextResponse.next()` atual;
  - no branch `!hasRefreshToken`: substituir
    `new URL("/admin/login", request.url)` +
    `NextResponse.redirect(loginUrl)` por
    `buildLoginUrlWithRedirect(request.nextUrl.pathname, request.nextUrl.search)`
    passado como path relativo para `new URL(..., request.url)`, mantendo
    `NextResponse.redirect(...)`;
  - no branch final (`hasRefreshToken` verdadeiro): retornar também
    `NextResponse.next({ request: { headers: requestHeaders } })` em vez de
    `NextResponse.next()`.
  - importar as constantes/funções de `@/lib/auth/redirect`.

### 4. Testes de `proxy.ts`

- [ ] Editar `proxy.test.ts` para cobrir:
  - sem `refresh_token`, rota original `/admin/trabalhos/123` → redirect
    para `/admin/login?redirect=%2Fadmin%2Ftrabalhos%2F123` (ou equivalente
    com query string original incluída);
  - sem `refresh_token`, rota original `/admin` (exata, sem sub-rota) →
    redirect para `/admin/login` sem `?redirect=`;
  - com `refresh_token`, `NextResponse.next()` inclui os headers
    `x-carshop-pathname` e `x-carshop-search` com os valores de
    `request.nextUrl`;
  - rota `/admin/login` (passthrough): `NextResponse.next()` também inclui
    os headers `x-carshop-pathname`/`x-carshop-search` (regressão do
    requisito "incondicionalmente, antes de qualquer `return`");
  - headers arbitrários enviados pelo client na request de entrada não
    conseguem forjar `x-carshop-pathname`/`x-carshop-search` — o proxy
    sempre sobrescreve com o valor real de `request.nextUrl`.

### 5. `(protected)/layout.tsx` — ler pathname via headers e redirecionar com `?redirect=`

- [ ] Editar `app/(admin)/admin/(protected)/layout.tsx`:
  - importar `headers` de `next/headers`;
  - importar `buildLoginUrlWithRedirect`, `REDIRECT_PATHNAME_HEADER`,
    `REDIRECT_SEARCH_HEADER`, `DEFAULT_ADMIN_PATH` de `@/lib/auth/redirect`;
  - dentro de `ProtectedAdminLayout`, ler
    `const requestHeaders = await headers()`;
  - `const pathname = requestHeaders.get(REDIRECT_PATHNAME_HEADER) ?? DEFAULT_ADMIN_PATH;`
  - `const search = requestHeaders.get(REDIRECT_SEARCH_HEADER) ?? "";`
  - no bloco `if (!session)`, substituir `redirect("/admin/login")` por
    `redirect(buildLoginUrlWithRedirect(pathname, search))`.

### 6. Testes de `(protected)/layout.tsx`

- [ ] Editar o teste correspondente para cobrir:
  - `getSession()` retorna `null` e os headers custom presentes com um
    pathname/search válidos → `redirect` é chamado com
    `/admin/login?redirect=<pathname+search>`;
  - `getSession()` retorna `null` e headers ausentes (fallback) →
    `redirect` é chamado apenas com `/admin/login` (fallback para
    `DEFAULT_ADMIN_PATH`, que `buildLoginRedirectTarget` trata como
    "sem redirect");
  - `getSession()` retorna uma sessão válida → `AuthProvider` é renderizado
    normalmente, sem chamar `redirect`.

### 7. `AuthProvider.tsx` — capturar rota atual em `onAuthFailure`

- [ ] Editar `lib/auth/AuthProvider.tsx`:
  - importar `usePathname`, `useSearchParams` de `next/navigation`, além do
    `useRouter` já existente;
  - importar `buildLoginUrlWithRedirect` de `@/lib/auth/redirect`;
  - dentro do componente, obter `const pathname = usePathname();` e
    `const searchParams = useSearchParams();`;
  - no `useEffect` que registra `onAuthFailure` (linhas 61-67 atuais),
    trocar `router.push("/admin/login")` por
    `router.push(buildLoginUrlWithRedirect(pathname, searchParams.toString() ? \`?${searchParams.toString()}\` : ""))`
    (ou equivalente que produza a `search` no formato esperado pelo módulo,
    incluindo o `?` inicial quando não vazio);
  - incluir `pathname` e `searchParams` nas deps do `useEffect`
    (`[router, pathname, searchParams]`);
  - **não** envolver `AuthProvider` em `<Suspense>` — já está sob o layout
    `(protected)` com `dynamic = "force-dynamic"`, então `useSearchParams()`
    aqui não exige boundary adicional.

### 8. Testes de `AuthProvider.tsx`

- [ ] Editar `lib/auth/AuthProvider.test.tsx` para cobrir:
  - `onAuthFailure` disparado com `usePathname()` mockado para uma rota
    protegida (ex.: `/admin/trabalhos/123`) e `useSearchParams()` mockado
    com um param (ex.: `?tab=fotos`) → `router.push` chamado com
    `/admin/login?redirect=%2Fadmin%2Ftrabalhos%2F123%3Ftab%3Dfotos` (ou
    equivalente devidamente encoded);
  - `onAuthFailure` disparado com `usePathname()` mockado para `/admin` →
    `router.push` chamado apenas com `/admin/login` (sem `?redirect=`).

### 9. `login/page.tsx` — extrair `LoginForm` e consumir `?redirect=`

- [ ] Extrair o conteúdo atual de `AdminLoginPage` (formulário completo,
  linhas 1-109 atuais) para um novo componente interno `LoginForm`
  (`"use client"`, mesmo arquivo ou arquivo colocado, conforme convenção já
  usada no projeto — ex. `create-work-form.tsx` como padrão de colocation).
- [ ] Dentro de `LoginForm`:
  - importar `useSearchParams` de `next/navigation` e
    `isSafeInternalRedirectPath`, `DEFAULT_ADMIN_PATH` de
    `@/lib/auth/redirect`;
  - ler `const redirectParam = useSearchParams().get(REDIRECT_QUERY_PARAM);`
    (importar `REDIRECT_QUERY_PARAM` também);
  - calcular o destino pós-login:
    `const target = isSafeInternalRedirectPath(redirectParam) ? redirectParam : DEFAULT_ADMIN_PATH;`
  - em `onSubmit`, após `login(values)` e `toast.success(...)`, trocar
    `router.push("/admin")` por `router.push(target)`.
- [ ] Reescrever `AdminLoginPage` como wrapper `"use client"`:
  ```tsx
  export default function AdminLoginPage() {
    return (
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    );
  }
  ```
  — necessário porque `useSearchParams()` dentro de `LoginForm` desotimiza
  a rota para renderização client-side; sem o `<Suspense>`, o build de
  produção falha/alerta.
  - importar `Suspense` de `react`.

### 10. Testes de `login/page.tsx`

- [ ] Editar o teste correspondente (`app/(admin)/admin/login/page.test.tsx`
  ou equivalente) para cobrir:
  - login com `?redirect=/admin/trabalhos/123` válido → após sucesso,
    `router.push` chamado com `/admin/trabalhos/123`;
  - login sem `redirect` → `router.push` chamado com `/admin` (comportamento
    atual preservado);
  - login com `redirect` malicioso (`?redirect=https://evil.com`,
    `?redirect=//evil.com`) → `router.push` chamado com `/admin`, nunca com
    a URL externa;
  - o wrapper `AdminLoginPage` renderiza `LoginForm` dentro de `Suspense`
    (smoke test, se aplicável ao padrão de teste já usado no projeto).

### 11. Validação final (checagem cruzada com a spec/DoD)

- [ ] `proxy.ts` seta `x-carshop-pathname`/`x-carshop-search`
  incondicionalmente, em todos os branches, antes de qualquer `return`.
- [ ] Nenhum header de entrada do client é confiado como fonte do
  pathname/search — sempre sobrescrito a partir de `request.nextUrl`.
- [ ] `(protected)/layout.tsx` usa fallback seguro
  (`DEFAULT_ADMIN_PATH`/`""`) quando os headers não estão presentes.
- [ ] `AuthProvider.tsx` inclui `pathname`/`searchParams` nas deps do
  `useEffect` de `onAuthFailure`.
- [ ] `login/page.tsx` valida `redirect` exclusivamente via
  `isSafeInternalRedirectPath` antes de usá-lo como destino de navegação —
  nenhum outro ponto do fluxo (proxy, layout, AuthProvider) decide se o
  valor é seguro para *uso final*, apenas o propaga.
- [ ] `<Suspense>` presente em `login/page.tsx` ao redor do componente que
  usa `useSearchParams()`.
- [ ] Nenhuma URL externa é alcançável como destino de `router.push`/
  `NextResponse.redirect` a partir de um valor de `redirect` malicioso
  (`https://`, `//`, `javascript:`).
- [ ] Nenhum segredo, token ou valor real de `.env` é referenciado em
  código, comentários ou testes.
- [ ] Cobertura de teste de `isSafeInternalRedirectPath` inclui todos os
  casos listados no passo 2 (não-negociável).

## Ordem de execução recomendada

1. Passo 1 e 2 (`lib/auth/redirect.ts` + testes) — módulo compartilhado
   isolado, sem dependências dos demais arquivos; deve ser implementado e
   validado primeiro, pois todos os outros passos importam dele.
2. Passo 3 e 4 (`proxy.ts` + testes) — camada Edge, primeira a rodar na
   requisição; estabelece a propagação de headers que o layout depende.
3. Passo 5 e 6 (`(protected)/layout.tsx` + testes) — depende dos headers
   setados no passo 2/3; validar a leitura com fallback antes de seguir.
4. Passo 7 e 8 (`AuthProvider.tsx` + testes) — client-side, independente
   dos passos 3-6, mas depende do módulo do passo 1.
5. Passo 9 e 10 (`login/page.tsx` + `LoginForm` + testes) — última camada,
   pois é a única fronteira real anti-open-redirect; implementar por
   último garante que os passos anteriores já produzem um `?redirect=`
   bem formado para testar contra ela.
6. Passo 11 (validação final) — checklist de fechamento para `tester` e
   `reviewer`.

## Riscos documentados

- **Headers incondicionais em `proxy.ts`**: se o `set()` dos headers
  `x-carshop-pathname`/`x-carshop-search` ficar atrás de um `return`
  antecipado (em especial o early-return de `/admin/login`), o
  `(protected)/layout.tsx` perde a rota atual em parte dos casos e cai
  sempre no fallback `DEFAULT_ADMIN_PATH`. Os testes do passo 4 cobrem
  explicitamente esse cenário de regressão.
- **`<Suspense>` ausente em `login/page.tsx`**: `useSearchParams()` sem
  boundary de `Suspense` causa erro de build/CSR bailout em produção. O
  passo 9 é obrigatório mesmo que o dev server não acuse o problema
  localmente.
- **Cobertura de `isSafeInternalRedirectPath`**: é o único vetor real de
  proteção contra open redirect no fluxo — qualquer lacuna nos casos de
  teste do passo 2 (em especial `//evil.com` e URLs absolutas) representa
  uma vulnerabilidade de segurança, não apenas uma falha de cobertura.

## Escopo explicitamente fora deste plano

- Qualquer mudança no backend/contrato de autenticação.
- Redirect-back para o fluxo de login público (não-admin).
- Persistência do destino do redirect em cookie/localStorage.
- Renomear ou reestruturar `proxy.ts` para `middleware.ts` (fora de escopo,
  não solicitado pela spec ou pela decisão do `architect`).
