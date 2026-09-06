# CARSHOP-99 — Padronizar variáveis de ambiente e URL da API no Next.js

- Epic: Frontend Base
- Component: Infra, Public UI, Admin UI
- Stack: Frontend
- Sprint: Sprint 3
- Priority: High
- Points: 2
- Status: To Do
- Fonte: Task Tracker (Notion), conteúdo colado integralmente pelo
  orquestrador nesta sessão (task-reader sem acesso ao conector Notion). Ver
  descrição/DoD/notas técnicas completas na task CARSHOP-99 do Notion — não
  duplicadas aqui além do necessário para escopo técnico.

## Conflito de estado documentado vs. estado real do repositório (BLOQUEANTE — sinalizar ao usuário)

O `CLAUDE.md` e `docs/rules/nextjs.md` descrevem o "estado real atual" como
"o app ainda roda em Vite + React Router" e tratam o App Router como
aplicável apenas "depois que o projeto tiver a dependência `next`
instalada". A inspeção direta do repositório (fonte de verdade mais
autoritativa, acima de docs e da task) mostra o oposto:

- `package.json`: dependências são `next@^16.3.4`, `react@^19.2.0`,
  `react-dom@^19.2.0`. Não há `vite` nem `react-router` em
  `dependencies`/`devDependencies` (só resíduo de `@vitejs/plugin-react` em
  devDependencies, usado apenas pelo Vitest, e `vitest` como test runner).
- Existe diretório `app/` com convenções do App Router:
  `app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`,
  `app/(admin)/admin/{layout,page}.tsx`, `app/(public)/{layout,page}.tsx` —
  route groups `(admin)`/`(public)` já em uso.
- Não há nenhuma ocorrência de `VITE_API_URL` ou `import.meta.env` em código
  do projeto (busca em todo o repositório fora de `node_modules`).
- `.env.example` já usa `NEXT_PUBLIC_API_URL=http://localhost:3333` (não
  `VITE_API_URL`).
- Git log recente confirma a migração: commits "migrar base do frontend de
  Vite para Next.js App Router" e "tornar as propriedades children das
  layouts como Readonly" já mesclados na `master`.

**Conclusão**: a migração Vite → Next.js App Router já ocorreu no código
(CARSHOP-113, aparentemente). A nomenclatura `VITE_API_URL`/
`import.meta.env` que o DoD desta task pede para "deixar de ser tratada
como padrão ativo" já não existe no código — o `.env.example` já segue a
convenção `NEXT_PUBLIC_`. Isso não invalida a task (ainda faltam
tipagem/validação de env, separação explícita server/client, e correção de
um problema real de versionamento do `.env`, descritos abaixo), mas o
DoD/Notas Técnicas da task no Notion partem de uma premissa (app ainda em
Vite) desatualizada em relação ao código. `CLAUDE.md` e
`docs/rules/nextjs.md` também estão desatualizados nesse ponto específico
("Estado real atual" e a condicional "só se aplica depois que o projeto
tiver a dependência `next` instalada") — **sinalizando ao usuário**: pode
valer abrir uma task/ADR específica para atualizar essa documentação
central, fora do escopo do CARSHOP-99 (que é sobre env vars, não sobre
reescrever a narrativa de migração no CLAUDE.md). Não resolvo essa
atualização de documentação estrutural sozinho — recomendo confirmação do
usuário antes de o `developer` tocar em `CLAUDE.md`/`docs/rules/nextjs.md`
além do necessário para esta task.

## Achado de segurança adicional (fora do texto original da task, real no repositório)

- `.gitignore` **não** ignora `.env`, `.env.local` ou variantes — só ignora
  `.next`, `coverage`, `*.local`, etc. O arquivo `.env` real existe na raiz
  do projeto e, como o `git status` no início desta sessão está limpo (sem
  arquivos untracked), tudo indica que `.env` já está versionado no
  histórico do git.
- `.env` contém `NEXT_PUBLIC_API_URL` (sem valor) e `OBSIDIAN_VAULT_ID` com
  um valor real já commitado no histórico do git. `OBSIDIAN_VAULT_ID` é
  documentado no `CLAUDE.md` como "opcional, não-secreta" — não é uma
  credencial de API. Ainda assim, isso viola diretamente o DoD "`.env` real
  permanece fora do versionamento" e o padrão geral do projeto. O valor não
  é reproduzido aqui nem deve ser reproduzido em specs futuras (ver
  [docs/rules/spec-security.md](../../docs/rules/spec-security.md)).
- Escopo desta task deve incluir corrigir o `.gitignore` e remover `.env`
  do tracking (`git rm --cached .env`) daqui para frente. Reescrever
  histórico do git (para remover o valor já commitado) é uma decisão maior
  (rewrite de histórico) que **não** faz parte do escopo padrão desta task —
  sinalizar ao usuário se ele quiser tratar isso separadamente, já que
  `OBSIDIAN_VAULT_ID` não é uma credencial e o risco é baixo, mas o padrão
  ficou quebrado.

## Escopo técnico

Repositório está com `app/` ainda em estado de esqueleto (apenas
`layout`/`page`/`error`/`not-found`, sem nenhum service, hook ou client de
API implementado ainda em `Public UI`/`Admin UI`). Não há hoje nenhuma
chamada de API hardcoded para corrigir — o trabalho desta task é
**estabelecer a convenção/infraestrutura de env** antes que essas chamadas
sejam implementadas em tasks futuras.

Arquivos/áreas prováveis a tocar:

1. `.gitignore` — adicionar `.env`, `.env*.local` (mantendo `.env.example`
   fora do ignore).
2. `.env` — remover do tracking do git (comando do `developer`, não edição
   de conteúdo sensível pela spec).
3. `.env.example` — já compatível com Next.js
   (`NEXT_PUBLIC_API_URL=http://localhost:3333`); revisar comentários para
   deixar explícito quais variáveis são públicas (`NEXT_PUBLIC_`) vs.
   server-only, e adicionar variáveis server-only de exemplo se a
   estratégia definida (item 4) precisar de alguma (ex.: uma URL interna
   diferente para chamadas server-side, se aplicável).
4. **Novo módulo de acesso/validação de env** (local exato é decisão do
   `architect`, já que o projeto ainda não tem uma pasta `lib/`/`config/`
   convencionada — só existe `app/`). Deve: ler `NEXT_PUBLIC_API_URL` para
   uso client-side, expor uma forma seria (não hardcoded) de obter a URL da
   API em Server Components/Route Handlers/services futuros, validar
   presença/formato da variável e falhar de forma previsível (erro claro em
   build/runtime) quando ausente/inválida.
   - **Dependência a confirmar antes de implementar**: `package.json`
     atual não tem `zod` nem nenhuma lib de validação de schema instalada
     (apesar de aparecer em `node_modules/.pnpm` como pacote transitivo/
     órfão de outro projeto compartilhando o store do pnpm — não é uma
     dependência declarada deste projeto). A stack alvo do CLAUDE.md inclui
     Zod. Se a validação de env exigir uma lib de schema, isso é uma
     **dependência a adicionar** (`npm install zod` ou equivalente) e deve
     ser sinalizada/decidida explicitamente, não assumida como já
     disponível — validação também pode ser feita sem lib externa
     (checagem manual) se o usuário preferir não adicionar dependência
     nesta task.
5. Documentação relacionada a env: `README.md` (seção de setup de `.env`)
   e `docs/rules/api.md` (linha já existente "Variáveis de ambiente de API
   ficam em `.env.example`, nunca com valores reais commitados" pode ser
   expandida para citar explicitamente a convenção `NEXT_PUBLIC_` vs.
   server-only do Next.js). Não inclui reescrever `CLAUDE.md`/
   `docs/rules/nextjs.md` quanto ao status da migração Vite→Next (ver seção
   de conflito acima).

## Critérios de aceite mapeados ao DoD

| DoD (Notion) | Critério de aceite nesta spec | Estado atual constatado |
|---|---|---|
| `.env.example` compatível com Next.js, só nomes/valores de exemplo seguros | `.env.example` mantém/expande `NEXT_PUBLIC_API_URL` com valor de exemplo local; nenhum valor real | Já compatível; revisão de comentários pendente |
| `VITE_API_URL`/`import.meta.env` deixam de ser padrão ativo | Confirmar ausência total no código (já confirmado) e não reintroduzir | Já satisfeito no código |
| Vars expostas ao browser usam `NEXT_PUBLIC_` e são não sensíveis | `NEXT_PUBLIC_API_URL` é a única var pública prevista; nenhuma credencial nela | Já satisfeito |
| Vars server-only não usam `NEXT_PUBLIC_` | `OBSIDIAN_VAULT_ID` já segue isso; qualquer var server-only futura também deve seguir | Já satisfeito |
| Nenhuma credencial exposta ao bundle cliente | Revisão do novo módulo de env + `.env.example` | A confirmar após implementação |
| URL da API não hardcoded em componentes/hooks/services | Não há esses arquivos ainda; convenção/módulo deve existir pronto para uso futuro (nada a corrigir hoje, mas a infraestrutura evita hardcode futuro) | N/A hoje, preventivo |
| Estratégia diferencia chamadas server vs. browser | Documentar/implementar padrão explícito (ex.: helper único que Server Components/Route Handlers e client hooks devem usar) | A implementar (decisão arquitetural) |
| Config ausente/inválida falha de forma previsível e segura | Módulo de env lança erro claro (não silencioso) quando `NEXT_PUBLIC_API_URL` ausente/mal formada | A implementar |
| Tipagem/validação adequada de acesso a env | Tipos explícitos (sem `any`) + validação de formato de URL; decisão sobre usar lib de schema (ver dependência) | A implementar |
| `.env` real fora do versionamento | Corrigir `.gitignore` e destrackear `.env` | **Não satisfeito hoje — achado de segurança acima** |
| Build, lint, typecheck passam | Rodar `npm run build`, `npm run lint`, `npm run typecheck` (scripts já existem no `package.json`) | A validar após implementação |
| Documentação relevante atualizada | `README.md` + `docs/rules/api.md` | A implementar |

## Classificação de tamanho

**NON-TRIVIAL** (plano obrigatório via `plan-writer`).

Justificativa:
- Envolve decisão arquitetural real: onde/como criar o módulo de
  acesso/validação de env (o projeto ainda não tem convenção de pastas
  `lib/`/`config/`), e se uma dependência de schema (Zod) deve ser
  adicionada — decisão que o `architect` precisa tomar antes da
  implementação, não é só editar um arquivo isolado.
- Toca múltiplas áreas: infraestrutura (`.gitignore`, tracking do `.env`),
  configuração de ambiente (`.env.example`), um novo módulo de código
  compartilhado, e documentação (`README.md`, `docs/rules/api.md`).
- Inclui um achado de segurança real (`.env` versionado) que precisa ser
  corrigido com cuidado (remover do tracking sem quebrar builds locais de
  outros devs, decidir se histórico do git precisa de ação futura).
- Apesar de Points=2 no Notion sugerir esforço pequeno, o volume de código
  em si é pequeno mas a decisão de design (padrão que será seguido por
  todas as chamadas de API futuras do projeto, tanto Admin quanto Public
  UI) tem impacto arquitetural amplo — exatamente o critério que separa
  NON-TRIVIAL de SMALL nas regras do workflow.

## Próximos agentes necessários

1. **`knowledge-reader`** — consultar Obsidian (`CarShop/Architecture`,
   `CarShop/ADRs`) por qualquer decisão já registrada sobre convenção de
   env vars, estrutura de pastas `lib/config` ou uso de Zod no frontend,
   antes do `architect` decidir. Se `OBSIDIAN_VAULT_ID` não estiver
   disponível no ambiente, seguir sem essa consulta e avisar o usuário.
2. **`architect`** — decidir (a) onde vive o módulo de acesso/validação de
   env (estrutura de pastas ainda inexistente no projeto), (b) o padrão
   exato que diferencia leitura de env em Server Components/Route
   Handlers vs. client-side, (c) se adicionar Zod como dependência ou usar
   validação manual.
3. **`plan-writer`** — obrigatório dado NON-TRIVIAL; plano deve cobrir a
   ordem: correção do `.gitignore`/untracking do `.env`, criação do módulo
   de env, atualização de `.env.example`, atualização de docs, validação
   de build/lint/typecheck.

`developer`, `tester` e `reviewer` seguem o fluxo padrão após o plano.
