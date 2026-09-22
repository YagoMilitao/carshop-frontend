# CARSHOP-150 — Corrigir loop de login por cookie de sessão cross-origin

## Origem

Task Notion CARSHOP-150 (Stack: Frontend · Component: Admin UI, Auth ·
Priority: High · Sprint 6 · Status: To Do · Type: Bug). Ver
Description/DoD/Technical Notes originais no Notion — não duplicados aqui.

## CONFLITO A SINALIZAR AO USUÁRIO (bloqueante para seguir sem validação)

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

**Isso não significa que o bug relatado (loop em `/admin/login`) esteja
resolvido** — apenas que o mecanismo mudou de lugar. Ver próxima seção.

## Estado atual real do fluxo de sessão (confirmado no repositório)

- `proxy.ts` (Edge, camada 1, `matcher: ["/admin/:path*"]`): lê o cookie
  `refresh_token` da requisição recebida pelo Next.js. Se ausente, redireciona
  direto para `/admin/login` **sem chamar o backend**. Se presente, chama
  `POST /auth/refresh` (server-to-server) e minta um `accessToken`, repassado
  via header interno `x-carshop-access-token` para o render seguinte.
- `app/(admin)/admin/(protected)/layout.tsx` (camada 2): chama
  `getSession()`, que só lê esse header interno e chama
  `GET /auth/session` com `Authorization: Bearer`. Nunca envia cookie.
- `lib/api/http.ts` (client-side, Axios): `baseURL` é
  `NEXT_PUBLIC_API_PROXY_PATH` (se definida) ou, caso contrário,
  `NEXT_PUBLIC_API_URL` direto. `NEXT_PUBLIC_API_PROXY_PATH` é **opcional e
  vazia por padrão** (ver `.env.example`).
- `next.config.mjs` já implementa um proxy de `rewrites()` (`/api-proxy/:path*`
  → backend), mas é **dev-only** (`if (process.env.NODE_ENV !== "development") return []`)
  e só entra em ação se `NEXT_PUBLIC_API_PROXY_PATH` estiver configurada para
  apontar para esse caminho — não é o comportamento padrão.

### Onde o loop cross-origin ainda ocorre de fato hoje

1. **Dev local sem `NEXT_PUBLIC_API_PROXY_PATH` configurada** (comportamento
   padrão do `.env.example`, ex. frontend em `:3000` e backend em `:3333`):
   `POST /auth/login` é chamado direto na origem do backend (`:3333`), que
   seta `Set-Cookie: refresh_token=...` nessa origem. O navegador nunca envia
   esse cookie de volta para requisições a `:3000`. Quando o Next.js
   (`proxy.ts`, rodando na origem do frontend) tenta ler
   `request.cookies.get("refresh_token")`, o cookie está ausente →
   redireciona para `/admin/login` mesmo com login bem-sucedido → loop.
2. **Produção sem domínio compartilhado nem proxy reverso equivalente**: o
   `rewrites()` de `next.config.mjs` é explicitamente dev-only; não há
   nenhuma configuração equivalente para produção nem evidência de domínio
   compartilhado com `Set-Cookie: Domain=...` apropriado. Se frontend e
   backend de produção estiverem em origens diferentes, o mesmo problema se
   repete.

Ou seja: o sintoma relatado no DoD ("login bem-sucedido... redireciona
corretamente... sem loop, tanto em dev local quanto no ambiente hospedado")
**ainda é um problema real e reproduzível**, mas a causa raiz técnica exata e
o ponto de código afetado mudaram desde que a Description foi escrita — a
causa agora está em `proxy.ts` (leitura de `refresh_token` bruto da
requisição do navegador) e na configuração de proxy/domínio ser opcional e
dev-only, não em `getSession()` repassando cookie ao backend.

## `docs/api-contract.md` / ADR-018 / ADR-016 (fonte preferencial indicada)

Conforme `docs/context/notion.md`, o contrato real de cookies/CSRF/SameSite
do `carshop-backend` (`docs/api-contract.md`, ADR-018/ADR-016) deveria ser
preferido às Technical Notes em caso de conflito. **Esses arquivos não foram
encontrados neste repositório** (busca por `**/api-contract.md`, `**/ADR-018*`,
`**/ADR-016*` não retornou resultados). Não há como confirmar atributos reais
de cookie (`SameSite`, `Domain`, `Secure`) do backend a partir deste
repositório frontend. Isso é uma dependência/bloqueio a registrar: a decisão
do `architect` entre as abordagens (a)/(b)/(c) do Technical Notes depende de
confirmar esses atributos no repositório/documentação do `carshop-backend`
(fora do escopo deste repo), ou de uma fonte equivalente confirmada com o
usuário.

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

## Escopo (decisão de arquitetura obrigatória — não implementar sem `architect`)

Conforme o próprio Technical Notes, há três abordagens possíveis e nenhuma
deve ser adotada unilateralmente:

- **(a)** Proxy reverso/rewrites tornando as chamadas de auth same-origin —
  já existe uma variante *parcial e opcional* disso hoje
  (`NEXT_PUBLIC_API_PROXY_PATH` + `rewrites()` dev-only). Uma decisão possível
  é tornar esse padrão obrigatório/default em vez de opt-in, e estendê-lo
  (ou um equivalente) para produção.
- **(b)** Domínio compartilhado com `Set-Cookie: Domain=` apropriado em
  produção — depende de confirmar o contrato real do backend
  (`docs/api-contract.md`/ADRs do `carshop-backend`, não encontrados neste
  repo) e de decisão de infraestrutura/deploy fora do escopo deste
  repositório frontend isolado.
- **(c)** Revisão mais ampla do fluxo de sessão, potencialmente envolvendo
  CARSHOP-2/29/122.

O `architect` decide qual abordagem seguir (ou combinação), considerando o
que já existe (`proxy.ts`, `next.config.mjs`, `lib/env/client.ts`,
`lib/api/http.ts`) para evitar duplicar mecanismos equivalentes.

## Escopo explicitamente fora desta spec

- Qualquer mudança no contrato HTTP do backend (`/auth/login`,
  `/auth/refresh`, `/auth/session`) sem confirmação do contrato real —
  proibido por regra do projeto (nunca inventar contrato de API).
- Migração do backend Express para Next.js Route Handlers — proibido sem
  tarefa arquitetural explícita/aprovação do usuário.

## Arquivos potencialmente afetados (a confirmar pelo `architect`/`plan-writer`)

- `proxy.ts`
- `next.config.mjs`
- `lib/env/client.ts` (`NEXT_PUBLIC_API_PROXY_PATH`)
- `lib/api/http.ts`
- `.env.example`
- Possivelmente `docs/rules/auth.md` (atualização de documentação do fluxo,
  responsabilidade típica do `developer`/`knowledge-manager` pós-implementação)

## Riscos e dependências

- Risco de regressão na proteção de rota `/admin/*` existente (DoD exige
  explicitamente "nenhuma regressão") — qualquer mudança em `proxy.ts` deve
  manter os testes existentes (`proxy.test.ts`) passando e cobrir os novos
  cenários.
- Dependência bloqueante: atributos reais de cookie do backend
  (`SameSite`/`Domain`/`Secure`) não confirmados neste repositório — sem
  isso, a abordagem (b) não pode ser avaliada com segurança pelo
  `architect`.
- Risco de sobreposição com mecanismo já existente
  (`NEXT_PUBLIC_API_PROXY_PATH`) se a solução for desenhada do zero sem
  considerar o que já está implementado.

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
- Há uma dependência bloqueante não resolvida (contrato real de cookies do
  backend, `docs/api-contract.md`/ADRs não encontrados neste repo) que afeta
  diretamente qual abordagem é viável.
- Risco real de regressão em um fluxo de autenticação já mexido por duas
  tasks recentes (CARSHOP-151, CARSHOP-152), exigindo plano cuidadoso de
  sequenciamento e testes.

## Próximos agentes necessários

- **`knowledge-reader`**: recomendado, para consultar o vault Obsidian
  (`/Users/yagomilitao/DEV/YagoMilitao/CarShop`) sobre decisões/histórico
  prévios do fluxo de sessão (CARSHOP-2, CARSHOP-29, CARSHOP-122) antes da
  decisão do `architect`.
- **`architect`** (obrigatório): decidir entre as abordagens (a)/(b)/(c) (ou
  combinação), considerando o mecanismo `NEXT_PUBLIC_API_PROXY_PATH` já
  existente e a dependência bloqueante de contrato de cookie do backend.
- **`plan-writer`** (obrigatório, task NON-TRIVIAL): persistir `plan.md` com
  base na decisão do `architect`, sequenciando mudanças em `proxy.ts`,
  configuração de env/build e testes, sem regressão na proteção de rota
  `/admin/*`.
