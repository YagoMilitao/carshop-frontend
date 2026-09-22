# CARSHOP-32 — Página /admin/trabalhos/[slug]/editar (edição)

## Referência

Descrição completa, DoD e Technical Notes: ver task CARSHOP-32 no Notion
(Sprint 6, Priority High, Component Works). Este spec não duplica o
conteúdo integral — resume decisões e resultado da verificação de estado
real do repositório.

## Resumo do objetivo

Criar a rota `/admin/trabalhos/[slug]/editar` para que o admin carregue um
trabalho existente pelo `slug`, edite os campos permitidos e persista as
alterações, reaproveitando o formulário/base de campos criados na
CARSHOP-134 sempre que fizer sentido.

## Estado atual verificado no repositório

- `app/(admin)/admin/(protected)/trabalhos/page.tsx` — listagem admin
  (CARSHOP-31), já implementada.
- `app/(admin)/admin/(protected)/trabalhos/work-list-item.tsx` — já contém
  um botão "Editar" **desabilitado** com `title="Disponível em breve"`
  (linhas 127-136), confirmando que esta é a peça pendente esperada.
- `app/(admin)/admin/(protected)/trabalhos/novo/create-work-form.tsx` —
  formulário de criação (CARSHOP-134), com schema Zod
  (`slug`, `title`, `description`, `category`, `tags`, `status`),
  `react-hook-form` + `zodResolver`, tratamento de erro via
  `getApiErrorMessage`, invalidação de `adminWorksQueryKey` e
  `revalidateWorksTag()` após sucesso. Boa parte da estrutura de campos é
  reaproveitável para edição.
- `lib/api/works.client.ts` — client Axios admin. Contém `getAdminWorks`,
  `createWork` (`POST /works`) e `deleteWork`
  (`DELETE /admin/works/:workId`). **Não existe `updateWork`/PATCH** nem
  nenhuma função de busca por `slug` no lado admin.
- `lib/api/works.ts` — client público (`fetch`, Server Components).
  Contém `getWorkBySlug`, mas o próprio comentário do código (linhas 86-96)
  documenta que essa função é uma **mitigação de lacuna de backend**: não
  existe `GET /works/:slug` real; a função busca a listagem completa via
  `getWorks()` (que retorna, por padrão, apenas `status: 'published'`) e
  filtra pelo slug no servidor.

## Conflito a reportar ao usuário (bloqueante para decisão de arquitetura)

A task no Notion afirma que `GET /works/{slug}` é um "endpoint público
existente" (CARSHOP-117) e instrui usá-lo diretamente para carregar dados
na página de edição. O estado real do código **contradiz** essa premissa:

1. **Não existe `GET /works/:slug` no backend.** O que existe é
   `getWorkBySlug` no client público, que é apenas uma filtragem client/
   server-side sobre `GET /works` (listagem completa).
2. **Essa listagem pública retorna, por padrão, apenas trabalhos
   publicados.** Um admin precisa poder editar também **rascunhos**
   (`status: draft`), que não aparecem nessa listagem pública sem o
   parâmetro `includeDrafts=true` — usado hoje apenas em
   `getAdminWorks()` (`GET /works?includeDrafts=true`, autenticado).

Consequência: usar a função pública `getWorkBySlug` como instruído no
Notion pode fazer a página de edição falhar silenciosamente (404/"não
encontrado") para qualquer trabalho em rascunho — um cenário central para
este DoD ("Loading, 401, 404, validação e conflitos são tratados
adequadamente").

Isso é uma decisão de arquitetura, não uma ambiguidade que este spec deva
resolver sozinho. Opções observadas (a serem avaliadas pelo `architect`):

- (a) buscar a listagem admin (`getAdminWorks`, já inclui drafts) no
  client/server e filtrar pelo `slug` no lado admin, análogo ao padrão já
  usado por `getWorkBySlug`, mas usando o endpoint autenticado; ou
- (b) registrar como dependência de backend a criação de um
  `GET /works/:slug` (ou `GET /admin/works/:slug`) real que inclua
  rascunhos, e reportar como blocker até existir.

Esse ponto deve ser explicitamente levado ao usuário antes de prosseguir
com a implementação.

## Dependência de backend confirmada como bloqueio

- **CARSHOP-135 (`PATCH` de atualização de work) não está implementada
  nem documentada em nenhum lugar do repositório** — busca confirmou que
  não há nenhuma referência a `PATCH /works` ou `updateWork` no código.
  Não existe arquivo de contrato de API dedicado (ex.:
  `docs/api-contract.md`); `docs/rules/api.md` apenas define que o
  Swagger/código do backend é a fonte de verdade, sem detalhar o
  contrato do endpoint de update de works.
- Consequência: **o botão "Salvar" / submit de edição não pode ser
  implementado contra um contrato real ainda**, por regra do CLAUDE.md
  (backend contract rule — nunca inventar endpoints/contratos). A
  implementação de persistência (chamada HTTP de update) fica
  **bloqueada até a CARSHOP-135 ser confirmada/documentada**.
- O que pode ser implementado desde já sem esse bloqueio: rota, layout,
  carregamento dos dados existentes (uma vez resolvido o conflito acima),
  formulário pré-preenchido reaproveitando a base da CARSHOP-134,
  validação client-side, e states de loading/401/404 — deixando o
  submit real isolado atrás de uma função `updateWork` a ser
  implementada quando o contrato da CARSHOP-135 estiver disponível.

## Escopo (quando desbloqueado)

- Nova rota `app/(admin)/admin/(protected)/trabalhos/[slug]/editar/page.tsx`.
- Novo componente de formulário de edição (ex.:
  `edit-work-form.tsx`), reaproveitando schema/campos de
  `create-work-form.tsx` sempre que reduzir duplicação sem acoplar os
  dois fluxos indevidamente (schema de validação pode ser extraído/
  compartilhado; comportamento de submit permanece distinto: create usa
  `POST`, edit usará o contrato da CARSHOP-135).
- Nova função de leitura admin por slug em `lib/api/works.client.ts` (ou
  equivalente), conforme decisão do `architect` sobre o conflito acima.
- Nova função `updateWork` em `lib/api/works.client.ts`, implementada
  somente após confirmação do contrato da CARSHOP-135.
- Habilitar o botão "Editar" hoje desabilitado em `work-list-item.tsx`
  (linhas 127-136), apontando para
  `/admin/trabalhos/${work.slug}/editar`.
- Tratamento de: loading, 401 (sessão expirada — CARSHOP-29), 404 (slug
  inexistente), erros de validação, conflitos de submissão, e navegação
  para a nova URL quando o slug é alterado (via `router.push`/
  `router.replace` para `/admin/trabalhos/${novoSlug}/editar` ou retorno
  à listagem, a decidir com o `architect`).

## Fora de escopo

- Qualquer implementação do endpoint `PATCH` no backend (fora deste
  repositório frontend).
- Upload/gestão de imagens do trabalho (já coberto por
  `work-list-item.tsx` via `uploadWorkImage`/`deleteWorkImage`).
- Alterar o comportamento de `getWorkBySlug` público (`lib/api/works.ts`),
  usado pela página pública `/portfolio/[slug]`.

## DoD (referência)

Ver DoD completo no Notion (CARSHOP-32). Pontos com impacto direto no
escopo acima: carregamento real via slug (sujeito à resolução do
conflito de dados), persistência via CARSHOP-135 (bloqueada), tratamento
de loading/401/404/validação/conflitos, reflexo dos dados atualizados
após salvar, e reaproveitamento de componentes de criação.

## Classificação de tamanho

**NON-TRIVIAL**

Justificativa:
- Múltiplos arquivos/áreas afetados: nova rota, novo formulário, novo(s)
  client(s) de API, alteração em `work-list-item.tsx`.
- Decisão de arquitetura necessária e não trivial: como carregar um work
  (incluindo rascunhos) por slug no contexto admin, dado que o endpoint
  presumido pelo Notion não existe da forma descrita.
- Dependência de backend não confirmada (CARSHOP-135) que bloqueia parte
  do fluxo principal e exige decisão explícita sobre como sequenciar o
  trabalho (implementar parcialmente vs. aguardar contrato).
- Conflito entre a premissa da task no Notion e o estado real do
  repositório, que precisa ser resolvido antes da implementação.

## Próximos agentes necessários

- `knowledge-reader`: útil para verificar se há notas no Obsidian sobre a
  decisão já tomada para `getWorkBySlug` (a mitigação documentada no
  código) e sobre o status/andamento da CARSHOP-135 no backend.
- `architect`: **obrigatório** — precisa decidir (1) como resolver o
  carregamento do work por slug no admin incluindo rascunhos, e (2) a
  estratégia de reaproveitamento entre `create-work-form.tsx` e o novo
  formulário de edição, e (3) como sequenciar/isolar a parte bloqueada
  pela CARSHOP-135 para permitir progresso parcial sem inventar contrato.
- `plan-writer`: **obrigatório**, dado o tamanho NON-TRIVIAL — plano deve
  registrar explicitamente o bloqueio da CARSHOP-135 e a decisão tomada
  para o carregamento por slug.

## Nota de segurança

Nenhum segredo, token ou valor real de `.env` foi incluído neste spec,
conforme `docs/rules/spec-security.md`.
