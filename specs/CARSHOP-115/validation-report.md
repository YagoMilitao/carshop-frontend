# Validation Report — CARSHOP-115

> Execução de validação/QA conforme `specs/CARSHOP-115/plan.md` e
> `specs/CARSHOP-115/spec.md`. Nenhum código de produção foi criado ou
> alterado por esta task. Data da execução: 2026-09-06.

## 1. Frontend isolado (typecheck / lint / build)

| Comando | Resultado |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | ✅ Sucesso, sem erros. |
| `npm run lint` (`eslint .`) | ✅ Sucesso, sem erros/warnings. |
| `npm run build` (`next build`, 1ª tentativa, sem `.env` local) | ❌ Falhou como esperado: `ZodError` em `lib/env/client.ts` (`NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_SITE_URL` ausentes). Este comportamento é o esperado e documentado na spec/plano (validação Zod falha rápido sem `.env`), **não é uma regressão**. |
| `npm run build` (2ª tentativa, após criar `.env` local a partir de `.env.example`) | ✅ Sucesso. Todas as 10 rotas geradas corretamente: `/`, `/_not-found`, `/about`, `/admin`, `/contact`, `/portfolio`, `/portfolio/[slug]` (dinâmica, server-rendered), `/robots.txt`, `/services`, `/sitemap.xml`. |

Não foi executado `npm run dev` de forma persistente na etapa 1 isolada —
foi executado depois, já com o `.env` e o backend prontos (ver seção 3),
para evitar subir o servidor duas vezes.

## 2. Ausência de resíduo ativo de Vite/React Router

- `package.json`: nenhuma dependência `vite` de app nem `react-router-dom`.
  Únicas referências a "vite" são o test runner `vitest`/`@vitejs/
  plugin-react` (esperado — Vitest é o test runner oficial do projeto, não
  o app Vite antigo) e os scripts `test`/`test:watch`/`test:coverage`.
- Busca por imports `from 'vite'` / `from 'react-router'` em todo o
  código-fonte (`.ts`/`.tsx`, excluindo `node_modules`/`.next`): nenhuma
  ocorrência, além dos imports esperados de `vitest` em `vitest.config.ts`
  e nos arquivos `*.test.ts(x)`.
- **Conclusão: confirmado, sem resíduo ativo.**

## 3. Backend local

- `package.json` do backend (`/Users/yagomilitao/DEV/Backend/carshop-backend`):
  script real de dev é `start:dev` (`ts-node --files --transpile-only -r
  tsconfig-paths/register src/main/index.ts`) — não `dev`.
- `.env` do backend: `PORT=3000`, `CORS_ORIGIN=http://localhost:3000,http://localhost:3001`.
  (Observação: `.env` também define `FRONTEND_URL=http://localhost:3004`,
  variável que não é lida pelo middleware de CORS — o allowlist real usado
  em `src/infra/config/middleware.ts`/`src/infra/config/env.ts` vem de
  `CORS_ORIGIN`, não de `FRONTEND_URL`. Essa variável `FRONTEND_URL` parece
  não utilizada/obsoleta no backend; não é código deste repositório, então
  fica apenas registrado como observação, sem correção.)
- **Bloqueio real encontrado (infraestrutura externa)**: a 1ª tentativa de
  subir o backend com o `MONGO_URI` real do `.env` (cluster MongoDB Atlas)
  falhou com o erro `Não foi possível conectar ao MongoDB Atlas porque o IP
  desta máquina não está liberado. Libere o IP em Atlas > Network Access e
  tente novamente.` Isso é um bloqueio de configuração de rede externa
  (Atlas Network Access), não um bug de código do backend nem do frontend.
- **Contorno usado apenas para viabilizar esta validação**: constatado que
  há um `mongod` local já em execução na máquina (`/opt/homebrew/opt/
  mongodb-community/bin/mongod`, porta padrão `27017`). O backend foi
  iniciado com a variável de ambiente `MONGO_URI` sobrescrita **apenas no
  processo** (não editado nenhum arquivo `.env`/código do backend):
  ```
  MONGO_URI="mongodb://localhost:27017/carshop-validation" npm run start:dev
  ```
  Com isso, o backend conectou com sucesso e subiu em
  `http://localhost:3000` (confirmado via log: `✅ Conectado ao MongoDB com
  sucesso.` / `✅ Servidor HTTP rodando em http://localhost:3000`).
- `curl -i http://localhost:3000/` → `HTTP/1.1 200 OK`, corpo `Hello
  World!` (rota de health check registrada em `src/infra/config/routes.ts`).
- **Este bloqueio de IP não liberado no Atlas deve ser reportado ao
  responsável pelo backend/infra — não é algo que o frontend ou esta task
  de validação deva corrigir.** Sem esse contorno local, os passos 4 a 7 do
  plano (integração real, CORS) não seriam executáveis nesta máquina.
- **Atualização (mesmo dia, após o restante desta validação)**: o IP desta
  máquina foi liberado no Atlas Network Access. Reconfirmado que o backend
  agora sobe com sucesso usando o `MONGO_URI` real do `.env` (cluster
  Atlas), **sem** o workaround do `mongod` local: `npm run start:dev` →
  log `✅ Conectado ao MongoDB com sucesso.` / `✅ Servidor HTTP rodando em
  http://localhost:3000`; `GET /works` → `200 OK`. Processo encerrado e
  porta `3000` confirmada livre após o teste. **Bloqueio de infraestrutura
  resolvido — não é mais necessário nenhum contorno local para subir o
  backend contra o banco real.**

## 4. Frontend + backend simultâneos

- Conflito de porta identificado: o backend usa `PORT=3000` (fixo no
  `.env` do backend) e o Next.js também usa `3000` por padrão — portanto o
  frontend foi subido explicitamente em `3001` (`next dev --port 3001`),
  que **já está** na allowlist `CORS_ORIGIN` do backend
  (`http://localhost:3000,http://localhost:3001`), evitando qualquer
  necessidade de alterar configuração do backend.
- `.env` local do frontend criado a partir de `.env.example`, com ajuste
  para refletir o ambiente real desta execução:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3000
  NEXT_PUBLIC_SITE_URL=http://localhost:3001
  OBSIDIAN_VAULT_ID=
  ```
  (`.env` é ignorado pelo git — `.gitignore:17` — confirmado que não será
  commitado.)
- `npm run dev -- --port 3001` subiu sem erro (`✓ Ready in 154ms`).
  `curl -i http://localhost:3001/` → `HTTP/1.1 200 OK`.

## 5. Tabela de rotas (curl, HTTP status + verificação de erro de servidor)

| Rota | Status HTTP | Sinal de erro de servidor no HTML? |
|---|---|---|
| `/` | 200 | Não |
| `/about` | 200 | Não |
| `/contact` | 200 | Não |
| `/portfolio` | 200 | Não |
| `/portfolio/exemplo-fake` (slug fictício) | 200 | Não |
| `/services` | 200 | Não |
| `/admin` | 200 | Não |

Nenhuma das 7 requisições gerou erro/warning no terminal do `next dev`
(log revisado linha a linha — apenas linhas `GET <rota> 200 in Xms`, sem
stack trace).

## 6. Teste de CORS/baseURL contra o backend real

Endpoint público real usado: `GET /works` (rota pública de listagem de
works, sem autenticação — `src/infra/http/routes/work.routes.ts`,
`requireAuthForDraftsMiddleware` só afeta a visibilidade de rascunhos, não
bloqueia a rota para visitantes anônimos).

- **Preflight `OPTIONS /works`** com `Origin: http://localhost:3001` e
  `Access-Control-Request-Method: GET` → `204 No Content`, com
  `Access-Control-Allow-Origin: http://localhost:3001`,
  `Access-Control-Allow-Credentials: true`,
  `Access-Control-Allow-Methods: GET,POST,PATCH,DELETE`. **CORS OK.**
- **Requisição real `GET /works`** com `Origin: http://localhost:3001` →
  `200 OK`, corpo `[]` (lista vazia, banco local sem dados — esperado),
  com `Access-Control-Allow-Origin: http://localhost:3001` presente na
  resposta. **Sucesso confirmado.**
- **Controle negativo**: `GET /works` com `Origin: http://evil.example.com`
  (origem fora da allowlist) → `500 Internal Server Error`, corpo
  `{"message":"Erro interno no servidor."}`, **sem** o header
  `Access-Control-Allow-Origin` na resposta. Confirma que a allowlist
  bloqueia origens não autorizadas. Observação (não é escopo desta task
  corrigir): o middleware `cors` propaga a rejeição como uma exceção
  capturada pelo error handler genérico, retornando `500` em vez de um
  `403`/mensagem mais específica de CORS — comportamento herdado do código
  do backend (`CARSHOP-111`), não introduzido por esta validação.
- **Caso de erro esperado (rota inexistente)**: `GET
  /nonexistent-endpoint` com `Origin: http://localhost:3001` → `404 Not
  Found`, corpo `{"message":"Rota não encontrada."}`, com
  `Access-Control-Allow-Origin: http://localhost:3001` presente
  corretamente mesmo em resposta de erro 404. Confirma que erros "normais"
  da API (404, etc.) preservam os headers de CORS para a origem permitida.
- Todo o teste foi feito via `curl` simulando a origem cross-origin
  (`-H "Origin: http://localhost:3001"`), já que não há nenhuma página do
  frontend hoje consumindo `lib/api/http.ts` — nenhum código de debug foi
  adicionado a nenhuma página/arquivo do repositório para este teste
  (conforme instrução do plano); nada precisou ser removido ao final.

## 7. Itens marcados N/A — não implementado

Conforme já definido na spec/plano (escopo confirmado pelo usuário), os
itens abaixo do DoD original são **N/A** nesta execução, pois as features
correspondentes não existem no frontend nesta data — não são falhas:

- Autenticação (login/sessão/refresh/logout).
- CSRF/credentials.
- Consumo de Works/Comments pelo frontend (o backend já expõe `/works` e
  rotas de comments, mas nenhuma página do frontend os consome ainda —
  apenas o teste de infraestrutura CORS da seção 6 exercitou o endpoint
  diretamente via `curl`, fora de qualquer página).
- Mutations (criação/edição/exclusão/moderação).

Nenhum código de integração real nessas áreas foi encontrado durante a
inspeção do frontend — confirma o estado já descrito na spec.

## 8. Erros/warnings observados e classificação

| Observação | Regressão? |
|---|---|
| `next build` falha sem `.env` local (ZodError) | Não — comportamento esperado/documentado, "fail fast" intencional da validação de env. |
| Backend não conecta ao MongoDB Atlas (IP não liberado) | **Bloqueio de infraestrutura externa** (configuração do Atlas Network Access), não um bug de código do frontend ou do backend. Reportar ao responsável pela infraestrutura do backend; não é candidato a Bug de código. |
| CORS bloqueado retorna `500` em vez de `403`/erro mais específico para origem não permitida | Comportamento pré-existente do backend (fora do escopo deste repositório); registrado como observação, não como regressão desta validação. |
| `FRONTEND_URL` no `.env` do backend não é lida pelo CORS (allowlist real é `CORS_ORIGIN`) | Observação de configuração do backend, fora do escopo deste repositório; não corrigido aqui. |
| `next dev` regenerou automaticamente um bloco em `AGENTS.md` (feature nativa do Next.js 16, `generate-agent-files.js`) | Efeito colateral do próprio `next dev`, não relacionado ao código da task; a alteração foi revertida com `git checkout -- AGENTS.md` ao final da validação, para não deixar diff não intencional no repositório. |

**Nenhuma regressão real de código foi encontrada em typecheck, lint,
build, rotas ou CORS.**

## 9. Limpeza ao final da execução

- Processo do backend (`start:dev`, rodando com `MONGO_URI` local
  sobrescrito apenas na variável de ambiente do processo) finalizado.
- Processo do frontend (`next dev --port 3001`) finalizado.
- Confirmado via `lsof -i :3000` e `lsof -i :3001` que nenhuma porta ficou
  ocupada após o encerramento.
- `.env` do backend **não foi editado** (override foi feito só via
  variável de ambiente do processo).
- `AGENTS.md` (modificado automaticamente por `next dev`) revertido com
  `git checkout -- AGENTS.md`.
- `.env` local do frontend foi mantido no disco (arquivo já coberto por
  `.gitignore`, útil para desenvolvimento local futuro), mas não foi
  commitado nem alterado o `.env.example`.
- Nenhum código de debug temporário foi criado em nenhuma página/arquivo
  do repositório.

## Limitações desta validação automatizada

Este agente **não tem acesso a um navegador real** (sem DevTools, sem
console do navegador, sem inspeção visual). Por isso, os seguintes pontos
do DoD/plano **não foram e não podem ser verificados por este agente**,
precisando de confirmação humana antes de considerar o DoD 100% atendido:

- **Renderização visual do Tailwind**: apenas confirmado via `curl` que
  cada rota retorna HTML com status 200 e sem stack trace de erro de
  servidor. Não foi verificado visualmente se as classes Tailwind estão
  sendo aplicadas corretamente, se o layout está correto, se há problemas
  de CSS/responsividade, etc.
- **Console do navegador**: não há como capturar erros/warnings de
  JavaScript client-side (hydration mismatches, erros de runtime que só
  aparecem no client, warnings do React) via `curl`. Isso exige abrir cada
  uma das 7 rotas em um navegador real com DevTools aberto.
- **Aba Network do navegador**: o teste de CORS foi feito via `curl`
  simulando a origem, o que confirma a configuração de infraestrutura
  (headers CORS corretos), mas não substitui a observação real de uma
  requisição disparada pelo próprio browser (nenhuma página consome
  `lib/api/http.ts` hoje, então isso também não teria superfície de teste
  real no browser além do que já foi validado aqui).

**Recomendação**: antes de marcar o DoD de CARSHOP-115 como 100% atendido,
um humano deve abrir as 7 rotas (`/`, `/about`, `/contact`, `/portfolio`,
`/portfolio/[slug]`, `/services`, `/admin`) em um navegador com backend e
frontend rodando localmente (`npm run dev` no frontend, `npm run
start:dev` no backend — com `MONGO_URI` acessível, ver bloqueio do Atlas
na seção 3) e confirmar visualmente Tailwind + console limpo.

## Ação recomendada (bloqueio de infraestrutura — RESOLVIDO)

O IP desta máquina não estava liberado no MongoDB Atlas usado pelo `.env`
real do backend (`Cluster0`), o que exigiu um contorno local (`mongod`)
durante a execução original desta validação. **Atualização**: o IP foi
liberado no Atlas Network Access após a validação inicial; reconfirmado
que o backend conecta normalmente ao banco real sem nenhum contorno (ver
seção 3). Nenhuma ação pendente restante neste ponto.

## Suíte de testes automatizados (Vitest)

Comando executado: `npm run test:coverage` (`vitest run --coverage`), na
raiz do frontend. Objetivo: confirmar que a suíte de testes unitários
já existente (`.test.tsx`/`.test.ts` de `app/`, `lib/`, etc.) não sofreu
regressão com a migração para Next.js. Nenhum teste novo foi criado e
nenhum código de produção ou de teste existente foi alterado — esta task
não altera código, então a meta aqui não é elevar cobertura, apenas
confirmar 100% de sucesso na suíte existente.

- **Test Files**: 19 passed (19) — nenhum arquivo de teste falhou.
- **Tests**: 40 passed (40) — nenhum teste individual falhou.
- **Duration**: 2.82s.
- **Cobertura resultante** (v8, todos os arquivos com teste associado):
  - Statements: 100% (42/42)
  - Branches: 100% (5/5)
  - Functions: 100% (20/20)
  - Lines: 100% (40/40)
  - Nenhuma linha não coberta reportada.

**Conclusão**: nenhuma regressão encontrada na suíte automatizada. Todos
os testes já existentes das rotas migradas para o App Router (`app/`) e
demais módulos continuam passando integralmente após a migração para
Next.js, com cobertura de 100% nos arquivos cobertos pela suíte atual
(bem acima do piso de 80% exigido pelo `CLAUDE.md` para código
novo/alterado — não aplicável aqui, já que esta task não altera código).

Observação incidental (não bloqueante, fora do escopo desta task):
Vitest reportou uma sugestão de performance ("Environment jsdom was
created 19 times... 61% of tracked time — create it once per worker with
`pool: 'vmThreads'` ou `isolate: false`"). Não é um erro nem uma
regressão, apenas uma sugestão de otimização da configuração de testes;
registrado aqui para eventual avaliação futura pelo `developer`, sem ação
corretiva nesta task.
