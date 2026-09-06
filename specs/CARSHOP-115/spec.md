# CARSHOP-115 — Validar frontend e integração com o backend após migração para Next.js

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Base
- **Component**: Quality, Public UI, Admin UI
- **Stack**: Frontend
- **Sprint**: Sprint 3
- **Priority**: High
- **Points**: 3
- **Status**: To Do

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-115` no Notion
Task Tracker (não duplicadas aqui além do necessário para orientar o
trabalho — ver seções abaixo).

## Objetivo

Validar, em ambiente local e contra o backend real (sem mocks), que o
frontend migrado para Next.js (App Router) continua funcional de forma
isolada (build, typecheck, lint, rotas) **e** que a integração real com o
backend Node.js/Express funciona (URL/baseURL, CORS, credentials/CSRF,
respostas de sucesso/erro), registrando qualquer regressão encontrada como
Bug separado — sem inventar endpoints/contratos para o teste "passar".

## Estado real do repositório (verificado nesta sessão)

Estes fatos já foram confirmados diretamente no código e servem como ponto
de partida para a validação (não precisam ser reconfirmados do zero pelo
`developer`/`tester`, mas a execução real ainda deve ser feita):

- `package.json` já é 100% Next.js: scripts `dev`/`build`/`start` via
  `next`, `lint` via `eslint .`, `typecheck` via `tsc --noEmit`, `test` via
  `vitest run`. Não há `vite`/`react-router-dom` nas dependências; o único
  resquício de "Vite" são os arquivos `vitest.config.ts`/`vitest.setup.ts`
  (esperado — Vitest é o test runner do projeto, não faz parte do app Vite
  antigo).
- Estrutura `app/` existe com rotas públicas (`(public)`: home, about,
  contact, portfolio, portfolio/[slug], services) e admin (`(admin)/admin`),
  `layout.tsx` raiz, `error.tsx`, `not-found.tsx`, `providers.tsx`,
  `robots.ts`, `sitemap.ts` — cada uma com teste unitário próprio
  (`.test.tsx`/`.test.ts`).
- **Todas as páginas públicas e admin inspecionadas são placeholders**
  ("página em construção" / sem lógica de negócio) — ex.: `app/(public)/
  portfolio/page.tsx` não faz nenhuma chamada HTTP hoje, apenas define
  `metadata` estática.
- Existe uma camada de infraestrutura HTTP já pronta para uso, mas **ainda
  não consumida por nenhuma página**:
  - `lib/api/http.ts`: instância única do Axios (`ADR-001`) com `baseURL:
    clientEnv.NEXT_PUBLIC_API_URL`, para chamadas client-side.
  - `lib/env/client.ts`: schema Zod validando `NEXT_PUBLIC_API_URL` e
    `NEXT_PUBLIC_SITE_URL` no boot (falha rápido se ausente/inválida).
  - `.env.example` define `NEXT_PUBLIC_API_URL=http://localhost:3333` e
    `NEXT_PUBLIC_SITE_URL=http://localhost:3000` como convenção local.
- Não há nenhum código de autenticação (login/sessão/refresh/CSRF/logout),
  nem consumo de Works/Comments, nem mutations (criação/edição/exclusão/
  moderação) implementados no frontend até o momento desta spec.
- `/Users/yagomilitao/DEV/Backend/carshop-backend` existe e tem
  dependências instaladas (`node_modules` presente), portanto a dependência
  "backend local executável" da task é satisfazível — os scripts reais do
  `package.json` do backend e o Swagger/OpenAPI (se existir) devem ser
  conferidos no início da execução para os comandos e contratos corretos, em
  vez de assumidos aqui.

## Escopo desta validação (derivado da Descrição/DoD)

1. **Frontend isolado**: `dev`, `build`, `typecheck`, `lint` sem erros
   bloqueantes; ausência de resíduos ativos de Vite/React Router no código
   (já verificado no `package.json`/dependências — confirmar também em
   imports/configs durante a execução).
2. **Rotas**: navegação manual das rotas públicas e admin existentes
   (listadas acima), validando layouts do App Router, Tailwind e
   componentes visuais.
3. **Integração real com o backend** (subindo `carshop-backend` localmente,
   usando os scripts reais dele):
   - `NEXT_PUBLIC_API_URL` aponta para o backend local corretamente.
   - CORS configurado corretamente para a origem do frontend local.
   - Chamadas reais aos endpoints **já implementados e já consumidos pelo
     frontend** — dado o estado atual (nenhuma página consome `http`
     ainda), este item tende a não ter superfície de teste na prática até
     que alguma página passe a chamar a API; ver "Conflito de escopo"
     abaixo.
   - Tratamento de respostas de sucesso/erro pela UI (idem — condicionado a
     haver alguma chamada real implementada).
4. **Autenticação/credentials/CSRF/Works/Comments/mutations**: a própria
   Descrição da task os condiciona a "quando os fluxos já estiverem
   implementados" — com o estado atual do repositório, nenhum desses fluxos
   existe no frontend, portanto esses itens do DoD são **não aplicáveis
   nesta execução** e devem ser registrados como tal (não como falha), a
   menos que o usuário aponte código de integração real que não foi
   encontrado nesta verificação.
5. **Observabilidade**: checagem de Network (status HTTP, payloads,
   headers, sem expor secrets/tokens), console do navegador e terminais do
   Next.js e do backend em busca de erros/warnings.
6. **Registro de regressões**: qualquer problema real encontrado é
   registrado como Bug separado no Task Tracker (fora do escopo desta spec
   resolver a causa raiz durante a validação, exceto se trivial).

## Conflito de escopo a sinalizar ao usuário

A Descrição e o DoD de `CARSHOP-115` pressupõem uma superfície de
integração (login/sessão/refresh/CSRF/logout, leitura de Works/Comments,
mutations) que **ainda não existe no código do frontend** — todas as
páginas atuais são placeholders sem chamadas HTTP reais, e não há nenhuma
tela de autenticação implementada. Isso não é necessariamente um bloqueio
(a própria task já prevê "quando já estiverem implementados"), mas significa
que, na prática, esta execução:

- Vai validar com solidez: build/typecheck/lint, navegação das rotas
  existentes (todas ainda placeholder), Tailwind/estilos, ausência de
  resíduos Vite/React Router, e a configuração de CORS/baseURL/env em nível
  de infraestrutura (`lib/api/http.ts`, `lib/env/client.ts`) mesmo sem
  chamadas de página reais.
- Não vai ter conteúdo real para validar nos itens de autenticação,
  Works/Comments e mutations, pois essas features não existem ainda no
  frontend — o DoD correspondente deve ser marcado como "N/A — feature não
  implementada" e não como aprovado/reprovado.

**Ação**: sinalizado ao usuário antes de prosseguir para os próximos
agentes, conforme regra do projeto (não resolver a ambiguidade sozinho).
Se o usuário confirmar que o escopo real é "validar o que já existe hoje",
a execução segue como descrito acima; se houver código de auth/API
consumption fora do que foi encontrado (ex.: em uma branch diferente), isso
deve ser apontado antes da execução.

## Critérios de aceite (derivados do DoD do Notion)

- [ ] Frontend (`next dev`) e backend local iniciam sem erro bloqueante.
- [ ] `next build` finaliza com sucesso.
- [ ] `npm run typecheck` e `npm run lint` passam sem erros bloqueantes.
- [ ] Todas as rotas públicas e admin existentes (listadas em "Estado real
      do repositório") foram navegadas manualmente sem erro de runtime.
- [ ] `NEXT_PUBLIC_API_URL`/CORS validados contra o backend local real.
- [ ] Para toda chamada real de API já implementada no frontend (se
      houver): sucesso/erro tratados corretamente, sem mocks.
- [ ] Itens de autenticação/CSRF/credentials/Works/Comments/mutations:
      marcados como "N/A — não implementado" nesta execução, salvo achado
      em contrário confirmado pelo usuário.
- [ ] Tailwind e componentes existentes renderizam corretamente nas rotas
      existentes.
- [ ] Nenhum resíduo ativo de Vite/React Router usado pelo código (fonte:
      `package.json`, imports).
- [ ] Network/console/terminal revisados; nenhum erro/warning relevante
      ignorado sem registro.
- [ ] Toda regressão real encontrada registrada como Bug separado no Task
      Tracker (não corrigida silenciosamente nesta task, salvo trivial e
      dentro do escopo de "validação").

## Fora de escopo

- Implementar qualquer feature (auth, Works, Comments, mutations) que ainda
  não exista — esta task é validação, não implementação de features novas.
- Acesso direto ao MongoDB pelo frontend.
- Duplicar regras de segurança que pertencem ao backend.
- Corrigir bugs não-triviais encontrados durante a validação (devem virar
  Bug separado, conforme instrução da própria task).

## Riscos

- Task de validação/QA manual, não de escrita de código — depende de
  ambiente local com backend executável (`carshop-backend`), o que é
  externo a este repositório e não garantido pelo agente sem execução real
  de comandos (fora do escopo do `spec-writer`).
- Superfície reduzida de integração real (ver conflito de escopo) pode
  fazer a task parecer "menor" na prática do que o DoD sugere — importante
  não inflar artificialmente a validação com chamadas ou fluxos que não
  existem no código.
- Risco de swagger/OpenAPI do backend estar desatualizado em relação ao
  código real — a Nota Técnica já orienta usar a implementação Express real
  como fonte de verdade quando houver divergência.

## Classificação de tamanho: NON-TRIVIAL

Justificativa: a task cobre múltiplas áreas (build/typecheck/lint,
navegação de todas as rotas públicas e admin, infraestrutura de rede
`lib/api/http.ts`/`lib/env`, CORS/credentials, e potencialmente
autenticação/Works/Comments quando implementados) e depende de execução
coordenada de **dois repositórios** (frontend + backend) em ambiente local
real, sem mocks — não é uma mudança pontual de baixo risco (`TRIVIAL`) nem
cabe em "poucos arquivos" (`SMALL`). Além disso, há um conflito de escopo
explícito (superfície de integração pressuposta pelo DoD vs. estado real do
código) que precisa de confirmação do usuário antes de definir o
plano de execução exato — critério adicional para `NON-TRIVIAL` conforme o
fluxo do projeto. **Plano obrigatório via `plan-writer`**, especificando a
sequência exata de comandos (frontend e backend), rotas a navegar e
critérios de "N/A" para os itens de auth/Works/Comments/mutations.

## Próximos agentes necessários

1. **Sinalizar ao usuário** o conflito de escopo descrito acima antes de
   prosseguir (superfície de integração pressuposta vs. features realmente
   implementadas no frontend hoje).
2. `knowledge-reader` — consultar Obsidian (`CarShop/Architecture`,
   `CarShop/ADRs`) por decisões prévias sobre CORS, autenticação
   (cookies HttpOnly, CSRF), `ADR-001` (Axios) e contrato de API do
   backend, e `CarShop/Studies` como não vinculante.
3. `architect` — não aplicável para decisão de estrutura/roteamento nova
   (esta task não cria rotas), mas pode ser consultado se a validação
   revelar necessidade de ajuste na estratégia Server/Client existente.
4. `plan-writer` — persistir `plan.md` (task NON-TRIVIAL), detalhando roteiro
   de execução da validação (comandos exatos do frontend e do backend,
   checklist por rota, critérios de sucesso/erro e itens N/A).
