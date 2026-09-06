# Plan — CARSHOP-115: Validar frontend e integração com o backend após migração para Next.js

> Classificação: NON-TRIVIAL. Plano persistido por `plan-writer` a partir da
> spec (`specs/CARSHOP-115/spec.md`). Esta task é validação/QA manual, não
> implementação de feature — este plano não introduz decisões
> arquiteturais novas, apenas roteiriza a execução.

## Escopo confirmado pelo usuário (não é uma decisão nova deste plano)

O usuário confirmou explicitamente: esta execução valida **apenas o que já
existe hoje no código** — build/typecheck/lint, subir frontend+backend
localmente, navegar as rotas existentes, e validar CORS/baseURL/env em
nível de infraestrutura. Os itens de auth/CSRF/credentials/Works/Comments/
mutations do DoD original são marcados no relatório final como **"N/A —
não implementado"**, nunca como falha, já que essas features não existem
no frontend nesta data. `knowledge-reader` confirmou que não há ADR que
contradiga esse escopo; `architect` não é necessário (nenhuma rota/
estrutura nova é criada por esta task).

## Pré-requisito a confirmar antes de iniciar (bloqueio documentado)

- Nenhum bloqueio de dependência ausente foi sinalizado — o backend
  (`/Users/yagomilitao/DEV/Backend/carshop-backend`) já existe localmente
  com `node_modules` instalado.
- **Antes de rodar qualquer comando do backend**, o `developer`/`tester`
  deve abrir o `package.json` real do backend e conferir os scripts
  disponíveis (não assumir `npm run dev`) e o `.env`/`.env.example` do
  backend para confirmar a porta/URL real em que ele sobe localmente. Se a
  porta real divergir de `http://localhost:3333` (valor de convenção em
  `.env.example` do frontend), isso deve ser ajustado no `.env` local do
  frontend antes de prosseguir — sem editar `.env.example` do frontend com
  valores reais.
- A allowlist de origens do CORS existe apenas no código do backend (já
  implementada e testada em CARSHOP-111) — não está documentada em nenhum
  ADR do frontend. Conferir no código do backend (não supor) se a origem
  local do frontend (`NEXT_PUBLIC_SITE_URL`, tipicamente
  `http://localhost:3000`) está na allowlist antes de testar a integração.

## Ordem de execução

### 1. Frontend isolado (sem depender do backend ainda)

Rodar, nesta ordem, em `/Users/yagomilitao/DEV/Frontend/React/carshop-frontend`:

1. `npm run typecheck` — deve finalizar sem erros.
2. `npm run lint` — deve finalizar sem erros bloqueantes.
3. `npm run build` — build de produção (`next build`) deve finalizar com
   sucesso; observar o terminal por warnings relevantes (ex.: env var
   ausente causando falha na validação Zod de `lib/env/client.ts`).
4. Conferir `package.json`/imports do projeto por resíduo ativo de
   `vite`/`react-router-dom` — confirmar que não há dependência nem import
   ativo (já verificado na spec, mas reconfirmar nesta execução).
5. `npm run dev` — subir o servidor de desenvolvimento e deixá-lo rodando
   para a navegação manual dos passos seguintes.

### 2. Subir o backend local

Em `/Users/yagomilitao/DEV/Backend/carshop-backend`:

1. Ler `package.json` do backend e identificar o script real de
   desenvolvimento (pode ou não se chamar `dev` — confirmar antes de
   rodar).
2. Ler `.env`/`.env.example` do backend para confirmar a porta/URL real de
   escuta local e a allowlist de CORS (se exposta via env var) ou o trecho
   de código onde a allowlist está hardcoded.
3. Subir o backend com o script confirmado no passo 1, mantendo o
   terminal visível para observar logs/erros durante os testes de
   integração.
4. Confirmar que `NEXT_PUBLIC_API_URL` no `.env` local do frontend aponta
   exatamente para a porta/host real identificados aqui (ajustar se
   necessário; não editar `.env.example` com valor real de produção).

### 3. Checklist de navegação manual das rotas existentes

Com frontend (`npm run dev`) e backend rodando simultaneamente, navegar
cada rota abaixo no navegador e, em cada uma, checar: (a) renderização sem
erro de runtime, (b) estilos Tailwind aplicados corretamente, (c) console
do navegador sem erros/warnings não esperados, (d) aba Network sem
chamadas falhando silenciosamente (esperado: nenhuma chamada de API nas
páginas placeholder, já que nenhuma consome `http` ainda).

- `/` (home)
- `/about`
- `/contact`
- `/portfolio`
- `/portfolio/[slug]` (usar um slug de exemplo fictício/neutro na URL, já
  que não há dados reais)
- `/services`
- `/admin`

Registrar o resultado de cada rota (OK / problema encontrado) para compor
o relatório final.

### 4. Validação prática de CORS/baseURL usando `lib/api/http.ts`

Como nenhuma página hoje consome `lib/api/http.ts`, exercitar a integração
real exige um teste manual mínimo e não-invasivo:

1. Identificar, na documentação/código do backend (Swagger/OpenAPI se
   existir, ou rota Express real), um endpoint público real (que não exija
   autenticação) para usar como alvo do teste — não inventar endpoint.
2. Com o frontend rodando, abrir o DevTools do navegador em qualquer
   página pública e, no console, importar/chamar a instância `http` (ex.:
   via um pequeno trecho temporário de código adicionado a uma página
   existente, do tipo `useEffect` de debug, **ou** diretamente testando a
   URL resultante via `fetch`/console contra o endpoint do backend) para
   confirmar: baseURL resolvido corretamente a partir de
   `NEXT_PUBLIC_API_URL`, requisição chega ao backend, resposta de sucesso
   recebida, e cabeçalhos CORS presentes na resposta (`Access-Control-Allow-Origin`
   correspondente à origem do frontend).
3. Testar também um caso de erro esperado (ex.: endpoint inexistente ou
   parâmetro inválido) para confirmar que o Axios propaga o erro de forma
   observável (sem tratamento de UI, já que nenhuma página trata isso
   ainda — o objetivo aqui é só confirmar que a chamada de rede e o CORS
   funcionam na prática).
4. **Qualquer código temporário criado para este teste manual (trecho de
   debug em página, chamada solta no console, arquivo de teste manual
   avulso) deve ser descartado ao final da validação — não deve ser
   commitado como feature nem deixado no código-fonte.**

### 5. Itens marcados N/A

Os itens abaixo do DoD original são marcados no relatório final como
"N/A — não implementado nesta execução", com a justificativa de que a
feature correspondente não existe no frontend nesta data (confirmado via
`knowledge-reader` e inspeção de código):

- Autenticação (login/sessão/refresh/logout).
- CSRF/credentials.
- Consumo de Works/Comments.
- Mutations (criação/edição/exclusão/moderação).

Se, durante a execução, for encontrado qualquer código de integração real
nessas áreas que não foi identificado na spec, isso deve ser reportado ao
usuário antes de classificar o item como N/A ou como falha.

### 6. Observabilidade e registro do resultado

- Revisar, ao longo de toda a execução: console do navegador, terminal do
  Next.js (`npm run dev`) e terminal do backend, em busca de
  erros/warnings — nenhum deve ser ignorado sem registro explícito no
  relatório.
- Ao final, registrar o resultado consolidado em
  `specs/CARSHOP-115/validation-report.md`, seguindo o padrão de formato
  já usado em tasks de validação anteriores (referência mencionada no
  Notion: `specs/CARSHOP-101/validation-report.md`), cobrindo pelo menos:
  - Resultado de typecheck/lint/build/dev (passo 1).
  - Comandos reais usados para subir o backend (passo 2), incluindo porta
    confirmada.
  - Tabela de rotas navegadas com status (passo 3).
  - Resultado do teste manual de CORS/baseURL (passo 4), incluindo
    endpoint usado e confirmação de que o código temporário foi removido.
  - Lista dos itens marcados N/A (passo 5), com justificativa.
  - Qualquer erro/warning observado (passo 6) e se foi ou não considerado
    regressão.

### 7. Regressões encontradas

- Qualquer problema real encontrado durante a validação (erro de build,
  rota quebrando em runtime, CORS mal configurado, etc.) é documentado no
  `validation-report.md` como candidato a Bug — o `developer`/`tester` não
  corrige a causa raiz nesta task (exceto se trivial e dentro do escopo de
  "validação", conforme a spec) e não cria a task de Bug no Notion por
  conta própria: isso é ação do `task-manager`, mediante confirmação
  explícita do usuário, seguindo a regra geral do fluxo do projeto de que
  nenhum agente cria tasks novas sem essa confirmação.

## Arquivos/áreas envolvidas

- Nenhum arquivo de código-fonte é criado ou editado por esta task (é
  validação, não implementação).
- Único artefato de saída: `specs/CARSHOP-115/validation-report.md`
  (novo arquivo).
- Áreas inspecionadas/exercitadas (sem alteração): `lib/api/http.ts`,
  `lib/env/client.ts`, `.env` local (não versionado) do frontend,
  `.env`/`package.json` do backend, todas as rotas em `app/(public)/*` e
  `app/(admin)/admin`.

## Critérios de aceite (mapeados ao escopo confirmado)

| Critério (spec, escopo confirmado) | Critério de aceite na execução |
|---|---|
| Frontend/backend sobem sem erro bloqueante | Passos 1 e 2 concluídos sem erro |
| `next build`, typecheck, lint passam | Passo 1, itens 1–3 |
| Rotas existentes navegadas sem erro de runtime | Passo 3 concluído para as 7 rotas listadas |
| CORS/baseURL validados contra backend real | Passo 4 concluído, com registro do resultado |
| Auth/CSRF/Works/Comments/mutations | Marcados N/A no relatório (passo 5) |
| Tailwind renderiza corretamente | Verificado por rota no passo 3 |
| Sem resíduo ativo de Vite/React Router | Confirmado no passo 1, item 4 |
| Network/console/terminal revisados | Passo 6 |
| Regressões reais registradas como Bug separado | Passo 7 (via `task-manager`, com confirmação do usuário) |
| Relatório final persistido | `specs/CARSHOP-115/validation-report.md` (passo 6) |

## Riscos e dependências

- Depende de execução real em ambiente local com dois repositórios
  rodando simultaneamente — não pode ser simulado apenas com leitura de
  código.
- A allowlist de CORS do backend só existe no código do backend; se a
  origem local do frontend não estiver nela, isso é uma configuração a
  ajustar no backend (fora do escopo de código deste repositório) — deve
  ser reportado, não corrigido aqui.
- Qualquer código de debug temporário criado para o teste manual do passo
  4 que acidentalmente for commitado é uma regressão do processo, não uma
  feature — deve ser removido antes de finalizar a task.
