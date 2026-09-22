# CARSHOP-150 — Corrigir loop de login por cookie de sessão cross-origin

## Origem

Task Notion CARSHOP-150 (Stack: Frontend · Component: Admin UI, Auth ·
Priority: High · Sprint 6 · Status: Review · Type: Bug). Ver
Description/DoD/Technical Notes originais no Notion — não duplicados aqui.

## Conflito identificado durante a especificação

A causa raiz descrita na Description do Notion **não corresponde mais ao
estado atual do código**:

- A Description afirma que `getSession()` (`lib/api/auth.server.ts`) "repassa
  os cookies recebidos na requisição ao Next.js para o backend via header
  Cookie" ao chamar o backend, e que por isso o cookie setado na origem do
  backend nunca chega nessa chamada server-side.
- Isso já não é verdade: desde a correção da CARSHOP-152 (documentada em
  `docs/rules/auth.md`, seção "Admin SSR session flow"), `getSession()` **não
  envia mais cookie nenhum** ao backend. Ele lê um header interno
  (`x-carshop-access-token`) injetado por `proxy.ts` e chama
  `GET /auth/session` com `Authorization: Bearer <accessToken>`. O
  `accessToken` é mintado em `proxy.ts` via `POST /auth/refresh`
  (server-to-server, fora do navegador), não depende de o navegador ter
  recebido o cookie na origem certa para *essa* chamada específica.

Ou seja, o mecanismo exato descrito como causa raiz na task já foi
substituído por outro fluxo (Bearer token mintado por camada de borda), numa
correção anterior (CARSHOP-152) que nem cita CARSHOP-150 no seu histórico.

Naquele momento, isso não significava que o bug relatado (loop em
`/admin/login`) estivesse resolvido — apenas que o mecanismo havia mudado de
lugar. O diagnóstico pré-implementação é registrado na próxima seção.

## Diagnóstico pré-implementação (confirmado no repositório)

- `proxy.ts` (Edge, camada 1, `matcher: ["/admin/:path*"]`): lê o cookie
  `refresh_token` da requisição recebida pelo Next.js. Se ausente, redireciona
  direto para `/admin/login` **sem chamar o backend**. Se presente, chama
  `POST /auth/refresh` (server-to-server) e minta um `accessToken`, repassado
  via header interno `x-carshop-access-token` para o render seguinte.
- `app/(admin)/admin/(protected)/layout.tsx` (camada 2): chama
  `getSession()`, que só lê esse header interno e chama
  `GET /auth/session` com `Authorization: Bearer`. Nunca envia cookie.
- Antes da CARSHOP-150, `lib/api/http.ts` (client-side, Axios) usava
  `baseURL` igual a
  `NEXT_PUBLIC_API_PROXY_PATH` (se definida) ou, caso contrário,
  `NEXT_PUBLIC_API_URL` direto. `NEXT_PUBLIC_API_PROXY_PATH` era **opcional e
  vazia por padrão** (ver `.env.example`).
- Antes da CARSHOP-150, `next.config.mjs` já implementava um proxy de
  `rewrites()` (`/api-proxy/:path*` → backend), mas era **dev-only**
  (`if (process.env.NODE_ENV !== "development") return []`) e só era usado
  pelo cliente se `NEXT_PUBLIC_API_PROXY_PATH` apontasse para esse caminho.

### Como o loop cross-origin ocorria antes do fix

1. **Dev local sem `NEXT_PUBLIC_API_PROXY_PATH` configurada** (comportamento
   padrão do `.env.example`, ex. frontend em `:3000` e backend em `:3333`):
   `POST /auth/login` é chamado direto na origem do backend (`:3333`), que
   seta `Set-Cookie: refresh_token=...` nessa origem. O navegador nunca envia
   esse cookie de volta para requisições a `:3000`. Quando o Next.js
   (`proxy.ts`, rodando na origem do frontend) tenta ler
   `request.cookies.get("refresh_token")`, o cookie está ausente →
   redireciona para `/admin/login` mesmo com login bem-sucedido → loop.
2. **Produção sem proxy reverso equivalente**: o `rewrites()` de
   `next.config.mjs` era explicitamente dev-only. O contrato confirmado do
   backend não define `Domain`, portanto os cookies são host-only. Se
   frontend e backend de produção estiverem em origens diferentes, o mesmo
   problema se repete.

Ou seja: antes da implementação, o sintoma relatado no DoD ("login
bem-sucedido... redireciona corretamente... sem loop, tanto em dev local
quanto no ambiente hospedado") era real e reproduzível, mas a causa raiz
técnica havia mudado desde que a Description foi escrita. O problema estava
na combinação entre `proxy.ts` ler o `refresh_token` recebido pelo frontend e
o proxy same-origin ser opcional/dev-only, não em `getSession()` repassar
cookie ao backend.

## Contrato de cookies do backend (confirmado)

Conforme `docs/context/notion.md`, o contrato real do `carshop-backend` foi
consultado remotamente em seu `docs/api-contract.md` versionado e cruzado
com `src/presentation/helpers/auth.cookies.ts` em 2026-09-22. O contrato
confirmado é:

- `refresh_token`: `HttpOnly`, `Secure`, `SameSite=None`, `Path=/`;
- `csrf_token`: não `HttpOnly`, `Secure`, `SameSite=None`, `Path=/`;
- nenhum dos cookies define `Domain`, portanto ambos são host-only.

Esses atributos são compatíveis com o rewrite same-origin adotado: como a
resposta chega ao navegador pela origem do frontend e não carrega `Domain`,
os cookies pertencem ao host do frontend e ficam disponíveis em `/admin`.
Não é necessário normalizar atributos de `Set-Cookie` em um proxy customizado.

## Relação com tasks correlatas já implementadas

- **CARSHOP-151** (redirect-back pós-login) e **CARSHOP-152** (home/dashboard
  admin) já alteraram partes do mesmo fluxo (`proxy.ts`,
  `(protected)/layout.tsx`, `getSession()`) depois que a Description da
  CARSHOP-150 foi escrita. Qualquer implementação desta task precisa partir
  do estado atual desses arquivos (já lido acima), não do estado descrito na
  Description original.
- **CARSHOP-134**: a Description confirma que a CARSHOP-150 foi descoberta
  durante teste manual da 134, mas não é uma regressão introduzida por ela.
- **CARSHOP-2, CARSHOP-29, CARSHOP-122**: citadas como relacionadas ao fluxo
  de sessão como um todo; não lidas em detalhe nesta spec (fora do escopo de
  leitura de código atual) — candidatas a contexto histórico via
  `knowledge-reader` no Obsidian.

## Decisão de arquitetura concluída

O `architect` avaliou as três abordagens das Technical Notes:

- **(a)** Proxy reverso/rewrites tornando as chamadas de auth same-origin —
  **selecionada e implementada** como padrão obrigatório em todos os
  ambientes, com `baseURL` fixo `/api-proxy` no cliente.
- **(b)** Domínio compartilhado com `Set-Cookie: Domain=` apropriado em
  produção — descartado porque o contrato confirmado usa cookies host-only
  e essa opção exigiria mudança coordenada de backend/infraestrutura.
- **(c)** Revisão mais ampla do fluxo de sessão — descartada porque a
  arquitetura de duas camadas da CARSHOP-152 permanece válida.

O plano correspondente está persistido em `plan.md` e não altera a lógica de
`proxy.ts`, `lib/api/auth.server.ts` nem o contrato HTTP do backend.

## Escopo explicitamente fora desta spec

- Qualquer mudança no contrato HTTP do backend (`/auth/login`,
  `/auth/refresh`, `/auth/session`) sem confirmação do contrato real —
  proibido por regra do projeto (nunca inventar contrato de API).
- Migração do backend Express para Next.js Route Handlers — proibido sem
  tarefa arquitetural explícita/aprovação do usuário.

## Arquivos definidos no plano

- `next.config.mjs`
- `lib/env/client.ts`
- `lib/api/http.ts`
- `.env.example`
- `docs/rules/auth.md`
- testes correspondentes.

## Riscos e dependências

- Risco de regressão na proteção de rota `/admin/*` existente (DoD exige
  explicitamente "nenhuma regressão") — qualquer mudança em `proxy.ts` deve
  manter os testes existentes (`proxy.test.ts`) passando e cobrir os novos
  cenários.
- Contrato externo: mudanças futuras em `Domain`, `Path`, `SameSite` ou
  `Secure` no backend precisam ser avaliadas contra o rewrite same-origin;
  os atributos atuais foram confirmados no contrato versionado e no helper
  que emite os cookies.
- Risco de configuração opcional permitir chamadas diretas ao backend —
  mitigado pela remoção de `NEXT_PUBLIC_API_PROXY_PATH` e pelo `baseURL`
  fixo `/api-proxy`.

## Observação de segurança

Nenhum segredo, token ou valor real de `.env` foi incluído nesta spec, em
conformidade com `docs/rules/spec-security.md`.

## Classificação de tamanho: NON-TRIVIAL

Justificativa:
- Decisão de arquitetura explicitamente obrigatória, com três abordagens
  concorrentes descritas nas próprias Technical Notes, sem resolução trivial.
- Múltiplas áreas potencialmente afetadas: middleware Edge (`proxy.ts`),
  configuração de build (`next.config.mjs`), camada de env/client HTTP
  (`lib/env/client.ts`, `lib/api/http.ts`), e possivelmente configuração de
  infraestrutura/deploy fora deste repositório.
- O contrato de cookies precisou ser validado no repositório remoto do
  backend por afetar diretamente a viabilidade do proxy same-origin.
- Risco real de regressão em um fluxo de autenticação já mexido por duas
  tasks recentes (CARSHOP-151, CARSHOP-152), exigindo plano cuidadoso de
  sequenciamento e testes.

## Próximos agentes necessários

- **`architect`**: decisão concluída pela abordagem (a), proxy same-origin
  obrigatório em todos os ambientes.
- **`plan-writer`**: plano persistido em `plan.md` e implementado.
- **`tester`/`reviewer`**: validar a implementação e os follow-ups do review,
  incluindo URL do backend com barra final e o contrato confirmado de cookies.
