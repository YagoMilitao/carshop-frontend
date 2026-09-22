# CARSHOP-150 — Plano de implementação: eliminar loop de login por cookie cross-origin

Task classificada como **NON-TRIVIAL** pelo `spec-writer`. Este plano
persiste fielmente a decisão do `architect` (ver seção "Decisão do architect
(fonte de verdade)" abaixo) e a traduz em passos acionáveis para o
`developer`/`tester`. Nenhuma decisão arquitetural nova é introduzida aqui.

## Confirmação prévia do usuário (pré-condição desta decisão)

O usuário confirmou que a produção do CarShop frontend roda em
Vercel/servidor Node (não `next export`/export estático). Isso é o que torna
o mecanismo `rewrites()` do Next.js viável em produção sem ressalva — em um
export estático, `rewrites()` não funcionaria e a decisão do `architect`
precisaria ser outra. Este plano assume essa confirmação como válida; se o
alvo de deploy mudar no futuro, a decisão precisa ser reaberta com o
`architect`.

## Decisão do architect (fonte de verdade — não reinterpretar)

- **Objetivo**: eliminar o loop de login em `/admin/login` causado por
  `refresh_token`/`csrf_token` sendo gravados na origem do backend em vez da
  origem do frontend.
- **Decisão**: generalizar o proxy same-origin já existente (`rewrites()` do
  Next.js + mecanismo de proxy path) para ser o comportamento **padrão
  obrigatório** em qualquer ambiente (dev e produção), em vez de
  opt-in/dev-only como é hoje.
- Abordagens descartadas pelo `architect`: (b) domínio compartilhado
  (exigiria mudança de contrato do backend) e (c) revisão ampla do fluxo de
  sessão (a arquitetura de duas camadas via `proxy.ts` + Bearer token, fixada
  na CARSHOP-152, já está correta e não muda nesta task).
- **Opção de configuração escolhida pelo architect**: remover a variável de
  ambiente `NEXT_PUBLIC_API_PROXY_PATH` por completo e fixar o caminho
  relativo same-origin como constante interna em `lib/api/http.ts` (opção
  (ii) do Technical Notes, recomendada pelo `architect`). Isso reduz a
  superfície de configuração e elimina o risco que causou o bug (esquecer de
  definir a env em produção). O caminho fixo é `/api-proxy` — mesmo prefixo
  já usado por `rewrites()` em `next.config.mjs`, para não introduzir uma
  segunda convenção de caminho.
- **Sem mudanças estruturais em**: `proxy.ts` (lógica interna — continua
  lendo `refresh_token` de `request.cookies` e chamando
  `serverEnv.apiUrl` diretamente, server-to-server, o que já é correto),
  `lib/api/auth.server.ts`, `app/(admin)/admin/(protected)/layout.tsx`,
  `lib/api/auth.client.ts`.

## Arquivos a alterar e ordem de implementação

1. **`next.config.mjs`**
   - Remover o guard `if (process.env.NODE_ENV !== "development") return [];`
     em `rewrites()`. O rewrite passa a valer em qualquer ambiente
     (dev, produção via Vercel/Node), condicionado apenas à presença de
     `NEXT_PUBLIC_API_URL` (guard existente `if (!backendUrl) return [];`
     é mantido).
   - Atualizar o comentário que hoje descreve o proxy como "dev-only" para
     refletir que é o comportamento padrão obrigatório em qualquer
     ambiente.
   - Manter o caminho `/api-proxy/:path*` → `${backendUrl}/:path*`
     inalterado (mesmo prefixo já usado hoje).

2. **`lib/env/client.ts`**
   - Remover o campo `NEXT_PUBLIC_API_PROXY_PATH` do `clientEnvSchema` e do
     objeto `clientEnv` (não é mais lido em runtime da aplicação).
   - Atualizar o comentário do schema que hoje explica a variável como
     "opcional, dev-only".

3. **`lib/api/http.ts`**
   - Remover o fallback condicional
     `clientEnv.NEXT_PUBLIC_API_PROXY_PATH ?? clientEnv.NEXT_PUBLIC_API_URL`.
   - Definir uma constante interna do módulo (ex.:
     `const API_PROXY_BASE_PATH = "/api-proxy";`) e usá-la como `baseURL`
     fixo do Axios, sempre — sem depender de nenhuma env client-side.
   - Atualizar o comentário do bloco que hoje descreve o proxy como
     opcional/dev-only.
   - `NEXT_PUBLIC_API_URL` continua sendo lida (via `clientEnv`) apenas
     onde já é necessária hoje: server-side (`proxy.ts` via `serverEnv`,
     `getSession()`) e como destino do `rewrites()` em `next.config.mjs`
     — não deve mais ser referenciada como possível `baseURL` do Axios
     client-side.

4. **`.env.example`**
   - Remover a linha `NEXT_PUBLIC_API_PROXY_PATH=` e seu bloco de
     comentário (a variável deixa de existir).
   - Ajustar, se necessário, o comentário de `NEXT_PUBLIC_API_URL` para
     deixar claro que ela é usada apenas server-side (proxy/rewrite) e
     nunca mais é lida diretamente pelo Axios client-side.

5. **`docs/rules/auth.md`**
   - Atualizar a seção "Admin SSR session flow" para deixar explícito que
     todas as chamadas client-side de autenticação (`lib/api/http.ts`)
     passam pelo proxy same-origin (`/api-proxy/:path*` via `rewrites()`)
     em qualquer ambiente, não apenas em dev — evitando que um leitor
     futuro assuma (como a Description original da CARSHOP-150 assumia)
     um mecanismo que já não corresponde ao código.

6. **Testes** (sequenciar junto com a mudança de código correspondente, não
   depois):
   - `lib/api/http.test.ts`: o teste atual (linha ~105-110) afirma
     `baseURL` igual a `"http://localhost:3333"` (valor de
     `NEXT_PUBLIC_API_URL` no ambiente de teste). Atualizar essa asserção
     para o novo caminho fixo (`"/api-proxy"`), já que o `baseURL` deixa
     de depender de env e passa a ser sempre o caminho relativo.
   - `lib/env/client.test.ts` (se existir cobertura de
     `NEXT_PUBLIC_API_PROXY_PATH`): remover/atualizar qualquer teste que
     assuma a variável como opcional no schema.
   - `proxy.test.ts`: não deve precisar de mudanças estruturais (a lógica
     interna de `proxy.ts` não muda), mas rodar a suíte completa depois das
     mudanças acima para confirmar ausência de regressão — nenhum teste ali
     depende de `NEXT_PUBLIC_API_PROXY_PATH`/`rewrites()`.
   - Rodar a suíte completa de testes (`npm test` ou equivalente
     configurado) após as mudanças acima, não apenas os arquivos tocados,
     para capturar qualquer outro teste que dependa implicitamente do
     `baseURL` antigo.

7. **Checar colisão de rota** antes de finalizar: confirmar que não existe
   nenhuma rota/convenção do App Router (`app/api-proxy/...`) ou middleware
   que já use o prefixo `/api-proxy` para outro propósito (checagem rápida
   de busca por `api-proxy` no repositório — já feita nesta fase de
   planejamento, sem ocorrências conflitantes fora de
   `next.config.mjs`/`lib/env/client.ts`/`lib/api/http.ts`/`.env.example`;
   o `developer` deve reconfirmar no momento da implementação caso o
   repositório tenha mudado).

## Validação manual obrigatória (além dos testes automatizados)

- Rodar `npm run dev` e testar login manualmente em cenário cross-origin
  local (frontend em `localhost:3000`, backend em `localhost:3333` ou
  outra porta distinta), confirmando que o cookie `refresh_token` passa a
  ser gravado na origem do frontend (via proxy) e que o login não entra em
  loop.
- Validar que a proteção de rota `/admin/*` continua funcionando: acesso
  sem sessão redireciona para `/admin/login`; acesso com sessão válida
  permanece autenticado.
- Login bem-sucedido redireciona para `/admin` sem loop, tanto em dev local
  quanto em produção hospedada (Vercel) — este é o DoD explícito da task.
  A validação em produção hospedada deve ser reportada como pendência caso
  não seja executável neste ambiente de desenvolvimento (registrar
  explicitamente se não puder ser validado em produção real antes da
  revisão).

## Riscos a mitigar (herdados da decisão do architect)

- Regressão em `proxy.test.ts` e nos testes de `http.ts` que assumem o
  comportamento opt-in atual do `baseURL`/`rewrites()` — mitigado pelo
  sequenciamento do item 6 acima (atualizar testes junto com o código, não
  depois).
- Nome de rota do proxy (`/api-proxy/:path*`) pode colidir com convenções de
  rota existentes — checagem preliminar feita (item 7); sem ocorrências
  conflitantes encontradas nesta fase de planejamento.
- Risco de esquecer de remover completamente `NEXT_PUBLIC_API_PROXY_PATH`
  de algum lugar residual (comentários, `.env` local do desenvolvedor,
  documentação) — o `developer` deve buscar por todas as ocorrências do
  nome da variável no repositório antes de considerar a etapa concluída.

## Fora de escopo / não fazer

- Não alterar o contrato HTTP do backend (`/auth/login`, `/auth/refresh`,
  `/auth/session`).
- Não migrar o backend Express para Next.js Route Handlers.
- Não reabrir a decisão entre abordagens (a)/(b)/(c) — já decidida pelo
  `architect` como (a) generalizada.
- Não alterar a lógica interna de `proxy.ts` (leitura de cookie, chamada a
  `/auth/refresh`, rotação de cookies) — está correta e fora de escopo
  desta task.

## Checklist de DoD técnico

- [ ] `next.config.mjs`: guard de `NODE_ENV !== "development"` removido de
      `rewrites()`; rewrite ativo em qualquer ambiente quando
      `NEXT_PUBLIC_API_URL` está definida.
- [ ] `lib/env/client.ts`: `NEXT_PUBLIC_API_PROXY_PATH` removida do schema e
      do objeto `clientEnv`.
- [ ] `lib/api/http.ts`: `baseURL` do Axios é sempre o caminho relativo fixo
      `/api-proxy`, sem fallback condicional a `NEXT_PUBLIC_API_URL`.
- [ ] `.env.example`: variável `NEXT_PUBLIC_API_PROXY_PATH` removida com seu
      comentário.
- [ ] `docs/rules/auth.md`: seção "Admin SSR session flow" atualizada para
      refletir o proxy same-origin obrigatório em qualquer ambiente.
- [ ] `lib/api/http.test.ts` atualizado para refletir o novo `baseURL`
      fixo; suíte completa de testes passando sem regressão.
- [ ] `proxy.test.ts` passando sem alteração estrutural necessária.
- [ ] Nenhuma colisão de rota com `/api-proxy` confirmada antes da
      finalização.
- [ ] Login bem-sucedido redireciona para `/admin` sem loop, validado
      manualmente via `npm run dev` em cenário cross-origin local.
- [ ] Proteção de rota `/admin/*` sem regressão (validada manualmente e via
      `proxy.test.ts`).
- [ ] Validação em ambiente hospedado (Vercel) confirmada ou reportada como
      pendência explícita se não executável neste momento.
- [ ] Strict TypeScript respeitado (sem `any`, `as any`, `@ts-ignore`,
      `@ts-expect-error`, ou cast inseguro) em todos os arquivos alterados.
- [ ] Cobertura de código novo/alterado em pelo menos 80%, quando
      aplicável.
- [ ] Nenhum segredo, token ou valor real de `.env` exposto em código,
      comentários, testes ou documentação (`docs/rules/spec-security.md`).

## Observação de segurança

Nenhum segredo, token ou valor real de `.env` foi incluído neste plano, em
conformidade com `docs/rules/spec-security.md`.
