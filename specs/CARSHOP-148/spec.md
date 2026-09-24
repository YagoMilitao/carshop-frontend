# CARSHOP-148 — Redesenhar experiência visual da área Admin

## Referência

Tarefa no Notion: CARSHOP-148 ("Redesenhar experiência visual da área
Admin"). Description, DoD e Technical Notes completos na tarefa — aqui só o
essencial.

Sprint 6 · Priority Medium · Component: Admin UI · 5 points · **Sem Figma**
(fonte visual autoritativa: `docs/design/*`, em especial
`visual-direction.md` → "Admin Experience", `components.md` → "Public vs
Admin", "Admin Table", "Admin Status", `spacing.md` → "Admin Spacing",
`typography.md` → "Admin Typography", `colors.md` → "Admin Colors").

Relacionadas: CARSHOP-142 (Done — fundação de tokens/primitives),
CARSHOP-143 (Done — shell público), CARSHOP-154 (merged — PATCH real na
edição), CARSHOP-149 (To Do — auditoria posterior), CARSHOP-76 (Backlog —
ver "Pontos em aberto").

Resumo do objetivo: dar ao admin uma linguagem visual coerente e
operacional (clareza, densidade, formulários, listas, estados e ações),
reaproveitando tokens/primitives existentes, **sem** importar a estética
editorial do site público e **sem** inventar funcionalidades (Technical
Notes: atuar só sobre telas admin já existentes).

## Estado atual do repositório (investigação)

### Já consolidado (não refazer)

- Tokens semânticos em `app/globals.css` já existem e são usados no admin:
  `surface`, `surface-warm`, `border-strong`, `focus-ring`, `destructive`,
  `destructive-text`, `success`, `success-text`, `warning`. Escala
  tipográfica semântica (`text-heading-*`, `text-body*`, `text-label`) já é
  consumida pelas telas admin.
- Todas as páginas protegidas já usam `PageSection spacing="compact"` +
  `Container` (`page` para listagens/dashboard, `reading` para
  formulários); `AdminShell` fornece o único `<main>`.
- Shell (CARSHOP-152): `AdminSidebar` (lg+, Server), `AdminMobileNav`
  (`Sheet`, < lg), `AdminNavLink` (`aria-current`), `AdminHeader` com
  "CarShop Admin" em texto e `AdminAccountMenu` (e-mail + "Sair").
- Primitives disponíveis em `components/ui/`: `button`, `card`, `badge`
  (variantes incl. `success`), `input`, `label`, `dialog`, `alert-dialog`,
  `sheet`. `sonner` é usado para toasts de sucesso/erro.
- Formulários (login, work create/edit, edit comment) já têm `Label`
  associado, `aria-invalid`, `aria-describedby` e mensagens de erro com
  `text-destructive-text`. Diálogos destrutivos usam `AlertDialog` com
  gestão explícita de foco no fechamento.

### Inconsistências observadas (candidatas ao escopo)

1. **Hierarquia de navegação**
   - `admin-nav-links.ts` lista "Novo trabalho" como item de nível 1 ao
     lado de "Trabalhos" (ação tratada como seção).
   - `AdminNavLink` só marca ativo em match exato (`pathname === href`):
     em `/admin/trabalhos/[slug]/editar` nenhum item fica ativo.
   - Sidebar não tem marca/título próprio; o nome "CarShop Admin" vive só
     no header, também em telas lg+.
2. **Campos de formulário sem primitive**
   - `<textarea>` e `<select>` nativos com classes duplicadas à mão em
     `trabalhos/work-form-fields.tsx` e `comentarios/_components/edit-comment-dialog.tsx`
     (`fieldClassName` local). Não existem `textarea`/`select` em
     `components/ui/`.
   - Bug visual: o `<select>` de status em `work-form-fields.tsx` usa
     `min-h-24` (copiado do textarea), ficando com ~96px de altura.
   - Não há agrupamento/hint padronizado; o botão de submit ocupa a
     largura inteira sem ação secundária ("Cancelar/Voltar") nos forms de
     work.
3. **Status**
   - Badge de status do work exibe o enum cru (`published`/`draft`) em
     inglês, enquanto o `<select>` do form usa "Publicado/Rascunho".
   - `PENDING` de comentários usa `outline` (neutro); existe token
     `warning`, mas não há variante `warning` no `Badge`.
     `docs/design/components.md` ("Admin Status") exige status com texto e
     semântica inequívoca.
4. **Ações e nomenclatura**
   - Mistura PT/EN: "Excluir work" (botão e título do diálogo), "Total de
     works", "Nenhum work cadastrado".
   - Remoção de imagem: botão "Remover" (`outline`) no grid vs ação
     "Excluir imagem" (`destructive`) no diálogo — terminologia e peso
     visual divergentes para a mesma ação destrutiva.
   - No card do work, "Excluir work" (`destructive`, tamanho default) fica
     ao lado de "Editar" (`outline`, `sm`) — tamanhos inconsistentes.
5. **Estados loading/error/empty**
   - Loading é só texto (`<output>` "Carregando...") e, no
     `DashboardSummary`, um "…" solto; nenhum skeleton/spinner.
   - Erro e empty são parágrafos simples, sem contêiner/ícone/ação de
     retry, com padrões ligeiramente diferentes por tela.
6. **Listagens**
   - `PendingCommentsList` (dashboard) exibe `workId` e ID do comentário
     crus, enquanto `CommentListItem` (moderação) já resolve o título do
     work — dois padrões diferentes para o mesmo dado.
   - Lista de trabalhos é um `Card` por work contendo grid de imagens +
     upload inline: densidade alta de ações por item; não há visão
     tabular/compacta.
7. **Login**: formulário centralizado em `Container variant="reading"`
   sem superfície/identificação do contexto admin; `Suspense
   fallback={null}` (tela vazia durante o carregamento).
8. **Ícones**: `AdminMobileNav` usa `lucide-react` (instalado); o stack
   oficial cita React Icons (também instalado). Não há padrão explícito de
   qual biblioteca usar no admin.

## Escopo

Aplicar uma linguagem visual operacional e consistente às telas admin
**existentes**:

- `/admin/login`
- Shell protegido (sidebar, header, mobile nav, account menu)
- `/admin` (dashboard: resumo + pendentes)
- `/admin/trabalhos` (lista, card do work, grid/upload/remoção de imagens,
  exclusão de work)
- `/admin/trabalhos/novo` e `/admin/trabalhos/[slug]/editar`
- `/admin/comentarios` (filtro, lista, paginação, diálogos de editar/excluir)

Itens concretos (limites finais definidos pelo `architect`):

1. Hierarquia do shell/navegação (seções vs ações, estado ativo em
   sub-rotas, identificação do admin na sidebar/header).
2. Primitives de campo faltantes para admin (textarea/select) ou padrão
   compartilhado equivalente, eliminando classes duplicadas e o bug de
   altura do select.
3. Linguagem única de status com variantes semânticas (incluindo `warning`
   quando justificado): labels de work em inglês (`Published`/`Draft`) via
   mapa único `workStatusLabels`, nunca o enum cru; status de comentários
   permanecem em PT-BR.
4. Padronização de ações: hierarquia primária/secundária/destrutiva,
   tamanhos coerentes dentro do mesmo grupo, terminologia PT-BR consistente
   ("Excluir trabalho", ação de imagem com mesmo verbo/peso no gatilho e no
   diálogo).
5. Padrão compartilhado de estados loading/error/empty/success por tela
   (skeleton/spinner permitidos no admin conforme `components.md`).
6. Densidade e responsividade conforme utilidade real do admin
   (desktop-first operacional, mobile/tablet utilizáveis).

## Fora de escopo

- Nova funcionalidade admin (novas seções, métricas, filtros, busca,
  ordenação, "ocultar comentário", reordenar/definir capa de imagem, etc.) —
  continuam com as tasks funcionais do Backlog (Technical Notes).
- Qualquer alteração de fluxo de auth/API, contratos HTTP, query keys,
  lógica de mutação/invalidação ou gestão de foco existente por motivo
  visual (DoD). Isso inclui o redirect pós-criação de work para `/admin`
  (ver "Pontos em aberto").
- Reverter decisões da CARSHOP-142: variantes de `Button` mantêm as chaves
  atuais; radius único Public/Admin; novos primitives shadcn apenas via CLI;
  sem `tailwind.config.ts`; display typography exclusiva do Public.
- Layouts hero/editoriais do site público no admin.
- Alterar o shell público (CARSHOP-143).
- Auditoria visual final (CARSHOP-149).

## Critérios de aceite (derivados do DoD)

- Navegação admin com hierarquia clara: seções distintas de ações, item
  ativo correto também em sub-rotas (ex.: edição de trabalho), consistente
  entre sidebar (lg+) e sheet (< lg).
- Login, dashboard, listagens, formulários, comentários, imagens e diálogos
  usam os mesmos primitives/tokens; nenhum campo com classes de estilo
  duplicadas à mão; select de status com altura de controle normal.
- Labels de status de work vêm de um único mapa (`workStatusLabels`),
  nunca do enum cru; valores em inglês: `Published`/`Draft` (decisão do
  usuário, reafirmando CARSHOP-34). Status de comentários permanecem em
  PT-BR. Todos com variante semântica distinguível.
- Ações destrutivas visual e textualmente inequívocas e consistentes entre
  gatilho e confirmação; confirmações preservam o comportamento atual de
  `AlertDialog` (bloqueio durante pending, retorno de foco).
- Loading/error/empty/success seguem um padrão compartilhado e
  reconhecível em todas as telas admin; erros continuam anunciados
  (`role="alert"`/`output`).
- Formulários preservam labels, `aria-invalid`/`aria-describedby`,
  mensagens de erro, ordem de foco e navegação por teclado; foco visível
  com `focus-ring`.
- Admin não usa composição hero/editorial nem tipografia display.
- Nenhum fluxo de auth/API reimplementado; testes funcionais existentes
  continuam passando (ajustes apenas em seletores/textos alterados
  intencionalmente).
- Mobile/tablet/desktop verificados na app rodando (dev server) para todas
  as telas do escopo.
- Acessibilidade (contraste WCAG, foco, semântica), `lint`, `typecheck`,
  `build` e testes relevantes passam; cobertura ≥ 80% no código
  novo/alterado quando aplicável.

## Pontos em aberto (sinalizar ao usuário, não bloqueiam)

1. **Sobreposição com CARSHOP-76** ("Refatorar páginas Admin para
   Tailwind", Backlog): o admin atual já é 100% Tailwind + tokens (não há
   CSS legado identificado nas telas admin). A CARSHOP-76 parece obsoleta
   ou absorvida por CARSHOP-142/148. Sugestão: o usuário decide se ela deve
   ser fechada/reescopada — esta task **não** altera a CARSHOP-76.
2. **"Novo trabalho" na navegação**: removê-lo do menu (mantendo o CTA na
   página de Trabalhos) muda a IA da navegação decidida na CARSHOP-152.
   É mudança visual/estrutural legítima para "hierarquia clara", mas altera
   decisão anterior do `architect` — requer confirmação do `architect`
   (e, se preferir, do usuário).
3. **IDs crus em `PendingCommentsList`**: substituir `workId`/ID do
   comentário pelo título do work (como na moderação) reutiliza a query
   `adminWorksQueryKey` já existente, sem novo endpoint. Confirmar se isso
   é aceitável nesta task (apresentação) ou se deve ficar para outra.
4. **Redirect pós-criação de work** vai para `/admin`, não para
   `/admin/trabalhos` (edição vai para `/admin/trabalhos`). É
   comportamento de fluxo, fora do escopo visual — registrado apenas como
   observação.
5. **Novos primitives** (`textarea`, `select` nativo estilizado ou shadcn
   `select`, `skeleton`, eventualmente `table`): pela regra da CARSHOP-142,
   só via CLI shadcn. `architect` deve decidir se entram e se o `select`
   continua nativo (mais simples, compatível com `register` do RHF).
6. **Biblioteca de ícones no admin** (`lucide-react` vs `react-icons`):
   ambas instaladas; `architect` define o padrão sem migrar o que já está
   correto.

### Resolvidos pelo usuário

- **Ponto 2**: "Novo trabalho" é removido da navegação e passa a ser CTA na
  lista de Trabalhos.
- **Ponto 3**: `PendingCommentsList` exibe o título do work nesta task.
- **Labels de status de work**: em inglês (`Published`/`Draft`), via
  `workStatusLabels` (reafirmando CARSHOP-34); comentários seguem em PT-BR.

## Riscos

- Testes existentes dependem de textos ("Excluir work", "Remover",
  "Carregando trabalhos...", enum de status): mudanças de copy exigem
  atualização coordenada dos testes, sem mudar asserções de comportamento.
- Alterar `Badge`/`Button` afeta também Public UI — preferir variantes
  aditivas; qualquer mudança em variante existente precisa checar os
  call-sites públicos.
- Lógica de foco em `WorkListItem`/`CommentModerationPanel` é sensível;
  reestruturar markup (ex.: card → linha de tabela) pode quebrar
  `onCloseAutoFocus`/headings focáveis.

## Classificação de tamanho

**NON-TRIVIAL** — toca ~15–20 arquivos em todas as telas admin, possivelmente
`components/ui/` (novos primitives/variantes compartilhados com Public), e
exige decisões de arquitetura/UI (hierarquia de navegação alterando
decisão da CARSHOP-152, padrão de estados, primitives de campo, densidade
da lista de trabalhos). Plano persistido obrigatório.

## Próximos agentes

- `knowledge-reader`: recomendado — notas de CARSHOP-142/152/35 no Obsidian
  sobre decisões de shell, foco e primitives.
- `architect`: obrigatório — resolver pontos em aberto 5 e 6 (pontos 2 e 3
  já resolvidos pelo usuário; não cabem mais ao `architect`), definir
  padrão de estados, status e ações, e estratégia responsiva do admin.
- `plan-writer`: obrigatório — faseamento sugerido: (1) primitives/variantes,
  (2) shell/navegação, (3) formulários + login, (4) listagens/dashboard/
  comentários/imagens, (5) testes e validação visual.
