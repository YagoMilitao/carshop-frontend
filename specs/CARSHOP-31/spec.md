# CARSHOP-31 — Criar página /admin/trabalhos (listar e ações)

Task tracker: CARSHOP-31 (Notion). Ver task-reader para Description/DoD/Technical
Notes completos — não duplicados aqui, apenas referenciados.

## Goal

Prover, em `/admin/trabalhos`, uma página dedicada para o admin listar todos
os trabalhos (incluindo drafts), navegar para criação/edição e excluir um
trabalho com confirmação prévia.

## Estado atual do repositório (verificado antes da spec)

- **Não existe rota `/admin/trabalhos`.** A listagem de works hoje vive
  embutida no Dashboard (`app/(admin)/admin/(protected)/page.tsx`, rota
  `/admin`), usando os componentes já implementados:
  - `app/(admin)/admin/(protected)/admin-work-list.tsx` (`AdminWorkList`) —
    busca via `useQuery` + `getAdminWorks` (`lib/api/works.client.ts`).
  - `app/(admin)/admin/(protected)/work-list-item.tsx` (`WorkListItem`) —
    renderiza cada work e já implementa exclusão via `deleteWork`.
  - Botão "Novo trabalho" já aponta para `/admin/trabalhos/novo`.
- **CARSHOP-134 (página de criação) já está implementada**:
  `app/(admin)/admin/(protected)/trabalhos/novo/page.tsx` +
  `create-work-form.tsx`. Dependência satisfeita.
- **CARSHOP-32 (fluxo de edição) NÃO está implementado.** Não há rota,
  componente ou spec para edição de work (busquei
  `specs/CARSHOP-32*`, rotas `trabalhos/**` e menções a "editar"/"edit" no
  admin — nada encontrado). **Isso é um bloqueio/risco a ser exposto ao
  usuário**, não resolvido nesta spec: o botão "Editar" não tem destino
  real ainda.
- **Exclusão hoje NÃO tem confirmação.** `WorkListItem.onDeleteWork` chama
  `deleteWork(work.id)` diretamente ao clicar em "Excluir work", sem
  diálogo de confirmação. Isso diverge do DoD desta tarefa ("consegue
  excluir com confirmação") e precisa ser corrigido.
- Não existe componente `AlertDialog`; existe apenas
  `components/ui/dialog.tsx` (Dialog genérico do Shadcn/UI), reutilizável
  para o diálogo de confirmação.
- Autenticação Bearer: já resolvida de forma transparente pelo interceptor
  Axios em `lib/api/http.ts` (`Authorization: Bearer <accessToken>`
  anexado automaticamente a toda request via instância única `http`).
  Nenhum código novo precisa manipular o token manualmente.

## Conflito de escopo a flagar ao usuário

A Description/Technical Notes do Notion pedem uma página dedicada
`/admin/trabalhos` para listar e agir sobre works. O código atual já
implementa listar + excluir (sem confirmação) **dentro do Dashboard**
(`/admin`), não em rota própria. Há uma decisão arquitetural implícita não
resolvida pelo Notion nem pelo código atual:

- Mover a listagem completa do Dashboard para `/admin/trabalhos` (Dashboard
  passaria a ter só um resumo/link, conforme já existe `DashboardSummary`)?
- Ou duplicar/manter a listagem no Dashboard e também criar
  `/admin/trabalhos` com a mesma listagem?

Isso não deve ser decidido silenciosamente aqui — fica registrado como
decisão a passar para `architect` (ver classificação abaixo).

## Escopo

- Criar rota `/admin/trabalhos`
  (`app/(admin)/admin/(protected)/trabalhos/page.tsx`) que lista works
  (incluindo drafts) via `GET /works?includeDrafts=true`, reaproveitando
  (ou movendo) `AdminWorkList`/`WorkListItem`.
- Botão "Novo trabalho" → `/admin/trabalhos/novo` (já existe, apenas
  garantir que a nova página o exponha).
- Botão "Editar" por work → destino do fluxo CARSHOP-32. Como essa página
  não existe, registrar isso como bloqueio explícito (ver acima) e decidir
  com o usuário/architect se o botão fica desabilitado/oculto ou aponta
  para um placeholder até CARSHOP-32 ser entregue.
- Adicionar confirmação antes de excluir (diálogo, usando
  `components/ui/dialog.tsx` ou padrão equivalente já estabelecido) antes
  de chamar `deleteWork`.
- Tratar erros da API de exclusão (já existe tratamento parcial via
  `getApiErrorMessage` em `WorkListItem` — reaproveitar).
- Decidir e implementar o que acontece com a listagem hoje embutida no
  Dashboard (mover vs. manter — depende da decisão de arquitetura acima).

## Fora de escopo

- Implementar o fluxo de edição em si (CARSHOP-32) — apenas referenciar/
  linkar quando existir.
- Alterar contrato de backend (`GET /works`, `DELETE /admin/works/{workId}`).
- Qualquer mudança em `POST /works` ou na página `/admin/trabalhos/novo`
  (CARSHOP-134), além de garantir que o link "Novo trabalho" continue
  funcionando a partir da nova rota.

## Contrato de API (confirmado no código, prioridade sobre Notion quando
divergem — aqui ambos concordam)

- `GET /works?includeDrafts=true` com `Authorization: Bearer` — via
  `getAdminWorks()` em `lib/api/works.client.ts`. **Nota:** as Technical
  Notes do Notion citam `GET /works?includeDrafts=true`, mas a Description
  também cita esse mesmo path — sem divergência real aqui, apenas
  confirmação.
- `DELETE /admin/works/{workId}` com `Authorization: Bearer` — via
  `deleteWork(workId)` em `lib/api/works.client.ts`. Confirma o aviso do
  Notion de **não usar** `DELETE /works/:id`.
- Ambos os endpoints já têm client implementado e testado
  (`admin-work-list.test.tsx`, `work-list-item.test.tsx` existentes).

## Componentes/rotas envolvidos

- Nova: `app/(admin)/admin/(protected)/trabalhos/page.tsx`.
- Existentes a reaproveitar/mover: `admin-work-list.tsx`, `work-list-item.tsx`.
- Possível ajuste: `app/(admin)/admin/(protected)/page.tsx` (Dashboard),
  dependendo da decisão de manter ou mover a listagem.
- Novo: diálogo de confirmação de exclusão (usar `components/ui/dialog.tsx`).
- Navegação: `_components/admin-nav-links.ts` / `admin-sidebar.tsx` — avaliar
  se precisa de item de menu para `/admin/trabalhos`.

## Critérios de aceite (derivados do DoD)

1. Admin autenticado acessa `/admin/trabalhos` e vê a lista de works,
   incluindo drafts.
2. Botão "Novo trabalho" navega para `/admin/trabalhos/novo` (CARSHOP-134).
3. Botão "Editar" existe por work; seu destino real depende da resolução do
   bloqueio CARSHOP-32 (não pode apontar para rota inexistente sem decisão
   explícita registrada).
4. Excluir um work exige confirmação explícita do admin antes de disparar
   `DELETE /admin/works/{workId}`.
5. Erros da API de exclusão são exibidos ao admin (mensagem de erro
   acessível, como já ocorre hoje via `getApiErrorMessage`).
6. Comportamento do Dashboard (`/admin`) em relação à listagem de works é
   consistente com a decisão de arquitetura tomada (sem duplicação
   acidental de lógica/UX).

## Dependências e bloqueios

- CARSHOP-13 (backend works): assumido satisfeito — endpoints já
  respondidos pelo client existente.
- CARSHOP-29 (sessão admin): satisfeito — Bearer resolvido via
  `lib/api/http.ts`.
- CARSHOP-134 (criação): **satisfeito**, rota já existe.
- CARSHOP-32 (edição): **NÃO satisfeito — bloqueio**. O botão "Editar"
  desta tarefa não tem destino real até CARSHOP-32 ser implementada.
  Necessário decidir com o usuário: implementar botão desabilitado/oculto
  agora, ou aguardar CARSHOP-32.

## Classificação de tamanho

**NON-TRIVIAL.**

Motivos:
- Envolve decisão arquitetural não resolvida por Notion nem pelo estado
  atual do código (onde a listagem de works deve viver: Dashboard vs. rota
  dedicada, e como reaproveitar/mover `AdminWorkList`/`WorkListItem`).
- Múltiplos arquivos/áreas afetadas: nova rota, componente de confirmação,
  possível refatoração do Dashboard, possível ajuste de navegação/menu.
- Há uma dependência bloqueada (CARSHOP-32) que exige decisão explícita
  sobre o comportamento do botão "Editar", não uma implementação trivial.

## Próximos agentes necessários

- `knowledge-reader`: útil para verificar se há decisões/padrões prévios no
  Obsidian sobre estrutura de páginas admin (`/admin/trabalhos` vs.
  Dashboard) ou sobre padrão de diálogo de confirmação já adotado em
  outra feature.
- `architect`: **obrigatório** — precisa decidir (a) onde a listagem de
  works deve residir (mover vs. duplicar vs. extrair componente
  compartilhado), (b) estrutura da rota `/admin/trabalhos`, (c) como tratar
  o botão "Editar" enquanto CARSHOP-32 não existe (oculto/desabilitado/
  placeholder), (d) padrão de diálogo de confirmação a adotar.
- `plan-writer`: **obrigatório**, por ser NON-TRIVIAL — plan.md deve
  refletir as decisões do `architect` antes da implementação.
