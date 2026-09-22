# CARSHOP-152 — Plano de implementação: Dashboard da home admin

Task classificada como **NON-TRIVIAL** pelo `spec-writer`. Este plano
persiste fielmente a decisão do `architect` (ver seção "Decisão do
architect (fonte de verdade)" abaixo) e a traduz em passos acionáveis para
o `developer`. Nenhuma decisão arquitetural nova é introduzida aqui.

## Contexto (resumo)

Decisão de escopo já validada com o usuário: evoluir a home admin existente
(`app/(admin)/admin/(protected)/page.tsx`, hoje só com `AdminWorkList` +
`CommentModerationForm`) para um dashboard completo, **sem criar rota
nova** — `/admin` continua sendo a home.

## Decisão do architect (fonte de verdade — não reinterpretar)

> ## Contexto
> Decisão de escopo validada com o usuário: evoluir a home admin existente (app/(admin)/admin/(protected)/page.tsx, hoje só com AdminWorkList + CommentModerationForm) para um dashboard completo, sem criar rota nova — /admin continua sendo a home.
>
> ## Estrutura de arquivos
> ```
> app/(admin)/admin/(protected)/
>   layout.tsx                      # Server, existente — extensão mínima: passa a renderizar AdminShell
>   _components/
>     admin-shell.tsx                # Server — composição sidebar + header + <main>
>     admin-nav-links.ts              # dado puro (href/label)
>     admin-nav-link.tsx              # Client — usePathname() p/ estado ativo
>     admin-sidebar.tsx               # Server — mapeia admin-nav-links via AdminNavLink
>     admin-mobile-nav.tsx            # Client — trigger + drawer (shadcn `sheet`) para <lg
>     admin-header.tsx                # Server — título de página + AdminMobileNav + AdminAccountMenu
>     admin-account-menu.tsx          # Client — useAuth() (email + logout)
>     dashboard-summary.tsx           # Client — cards de métricas (works + comentários pendentes)
>     pending-comments-list.tsx       # Client — lista real de comentários PENDING (useQuery)
>   page.tsx                          # Server, existente — recomposto (ver seções abaixo)
>   admin-work-list.tsx               # existente, reutilizado sem mudanças
>   work-list-item.tsx                # existente, reutilizado
>   comment-moderation-form.tsx       # existente, reutilizado — atualizar/remover comentário sobre gap de listagem (endpoint agora existe)
> ```
>
> _components/ é privado da rota (admin autenticado), não usar components/layout/ (esse é do shell público).
>
> ## Shell — Server/Client
> - layout.tsx: mantém getSession()/redirect/AuthProvider, passa a envolver children em <AdminShell>.
> - AdminShell: Server, puro markup de composição (sidebar fixa desktop + header + <main>).
> - AdminSidebar: Server. Apenas 2 itens reais: "Dashboard" (/admin) e "Novo trabalho" (/admin/trabalhos/novo). Não inventar itens de menu (nada de "Usuários"/"Configurações").
> - AdminNavLink: Client, só por causa de usePathname() para estado ativo — fronteira mínima.
> - AdminMobileNav: Client, drawer para <lg usando o componente `sheet` do Shadcn (instalar via `npx shadcn@latest add sheet`, ainda não existe em components/ui/). Não reaproveitar Dialog como substituto.
> - AdminHeader: Server, chrome estático + embute AdminMobileNav (client) e AdminAccountMenu (client).
> - AdminAccountMenu: Client, "use client", usa useAuth() para exibir e-mail do usuário e botão de logout (useAuth().logout()) — hoje não existe botão de logout em lugar nenhum do admin, essa é uma lacuna funcional real que o shell resolve.
>
> ## page.tsx — recomposição
> Server Component puro, sem "use client". Renomear <h1> de "Admin" para "Dashboard". Ordem das seções:
> 1. "Visão geral" → <DashboardSummary /> (Client): cards Shadcn (Card/CardHeader/CardContent) com Total de works, Publicados vs Rascunho, Comentários pendentes. Tipografia Admin (text-body-lg/text-label, Manrope — nunca heading-4/Barlow Condensed). Não inventar métricas além dessas (nada de "visitas"/"conversão").
> 2. "Works" → CTA "Novo trabalho" + AdminWorkList (inalterado).
> 3. "Comentários" → PendingCommentsList (novo) + CommentModerationForm (existente, mantido).
>
> Layout: grid responsivo para cards (1 col mobile → 2-3 col desktop), Container variant="page" (não "reading" — cards precisam mais largura). Sidebar colapsa para AdminMobileNav (drawer) abaixo do breakpoint lg.
>
> Opcional (reportar como decisão em aberto para o developer confirmar, não obrigatório): clique num item de PendingCommentsList pré-preenche commentId/workId no CommentModerationForm — se adotado, encapsular ambos num único Client Component _components/comments-panel.tsx ("use client"), sem subir estado para page.tsx.
>
> ## Dados
> - Works (resumo + lista): reaproveitar adminWorksQueryKey/getAdminWorks() (lib/api/works.client.ts, GET /works?includeDrafts=true). DashboardSummary roda useQuery com a MESMA queryKey — cache compartilhado via QueryClientProvider global (app/providers.tsx), sem fetch duplicado. Contagem publicado/rascunho via useMemo local sobre data.
> - Comentários pendentes: trabalho novo em lib/api/comments.client.ts:
>   ```ts
>   export const adminCommentsQueryKey = (status?: CommentStatus) => ["admin", "comments", status] as const;
>   export async function getAdminComments(params: { status?: CommentStatus; page?: number }): Promise<...> { ... }
>   ```
>   BLOQUEIO A CONFIRMAR pelo developer antes de implementar: formato exato da resposta paginada de GET /admin/comments (envelope { items, total, page, pageSize } vs array simples etc.) não foi confirmado no repositório — só a existência do endpoint com paginação/filtro foi levantada como contexto. O developer DEVE confirmar o contrato real (Swagger/backend) antes de tipar getAdminComments — nunca usar any/cast inseguro como atalho.
> - Nenhum endpoint de métricas/analytics dedicado é necessário.
>
> ## globals.css
> Decisão: NÃO reintroduzir os tokens --sidebar-* a priori (removidos no ADR-009 addendum CARSHOP-74 por falta de uso). A sidebar deste dashboard é simples (2 links) e não justifica o primitivo `sidebar` completo do Shadcn — usar composição manual com tokens semânticos já existentes (--surface, --border, --muted-foreground, --accent). Tokens --chart-* continuam fora de escopo (nenhum gráfico nesta task). Se o developer/reviewer avaliarem que o primitivo sidebar do Shadcn é preferível, isso é uma decisão arquitetural a reabrir com o architect, não a decidir silenciosamente na implementação.
>
> ## Componentes
> Reutilizados sem alteração de contrato: AdminWorkList, WorkListItem, CommentModerationForm, Button, Card/CardHeader/CardContent, Container, PageSection.
> Novos (em app/(admin)/admin/(protected)/_components/): admin-shell.tsx, admin-nav-links.ts, admin-sidebar.tsx, admin-nav-link.tsx, admin-mobile-nav.tsx, admin-header.tsx, admin-account-menu.tsx, dashboard-summary.tsx, pending-comments-list.tsx.
> Dependência nova: components/ui/sheet.tsx via Shadcn CLI.
> Nova função de API: getAdminComments em lib/api/comments.client.ts (contrato a confirmar).
>
> ## Riscos/observações a manter no plano
> - Contrato de GET /admin/comments não totalmente confirmado no repositório — developer deve validar Swagger real antes de codar getAdminComments.
> - Clique-para-pré-preencher é opcional/em aberto, não obrigatório para esta task.
> - AdminAccountMenu é peça funcional nova (não é "só CSS").
> - Não há Figma aprovado conhecido para este dashboard — se aparecer um, prevalece sobre esta decisão estrutural.
>
> ## Arquivos impactados esperados
> app/(admin)/admin/(protected)/layout.tsx, page.tsx, _components/* (novos), comment-moderation-form.tsx (atualizar comentário obsoleto), lib/api/comments.client.ts, components/ui/sheet.tsx (novo via CLI), testes colocalizados (*.test.tsx/*.test.ts) para cada arquivo novo/alterado relevante. app/globals.css sem mudança a priori.

## BLOQUEIO A CONFIRMAR ANTES DE IMPLEMENTAR

Antes de escrever `getAdminComments`/tipos em `lib/api/comments.client.ts`,
o `developer` **deve** confirmar com o usuário/Swagger/backend real o
formato exato da resposta paginada de `GET /admin/comments` (envelope
`{ items, total, page, pageSize }` vs array simples vs outro formato). Não
inventar o contrato, não usar `any`/cast inseguro como atalho enquanto o
contrato não é confirmado. Se o endpoint não existir como esperado, registrar
como dependência/bloqueio e reportar ao usuário em vez de prosseguir com
suposições.

## Ordem de implementação sugerida

1. **Confirmar o bloqueio de contrato** de `GET /admin/comments` (Swagger/
   backend real) antes de qualquer código em `lib/api/comments.client.ts`.
2. **Instalar dependência nova**: `npx shadcn@latest add sheet` (gera
   `components/ui/sheet.tsx`). Não reaproveitar `Dialog` como substituto.
3. **Camada de dados**:
   - Criar `lib/api/comments.client.ts` com `adminCommentsQueryKey` e
     `getAdminComments`, já com o contrato confirmado no passo 1, tipagem
     estrita (sem `any`/`as any`/`@ts-ignore`/`@ts-expect-error`).
4. **Shell admin (navegação/header/conta)**:
   - `_components/admin-nav-links.ts` — dado puro com os 2 itens reais:
     "Dashboard" (`/admin`) e "Novo trabalho" (`/admin/trabalhos/novo`).
   - `_components/admin-nav-link.tsx` — Client, `usePathname()` para estado
     ativo.
   - `_components/admin-sidebar.tsx` — Server, mapeia `admin-nav-links` via
     `AdminNavLink`; composição manual com tokens semânticos existentes
     (`--surface`, `--border`, `--muted-foreground`, `--accent`) — sem
     reintroduzir `--sidebar-*`.
   - `_components/admin-mobile-nav.tsx` — Client, trigger + drawer usando
     `sheet` do Shadcn, ativo abaixo do breakpoint `lg`.
   - `_components/admin-account-menu.tsx` — Client, `"use client"`, usa
     `useAuth()` para exibir e-mail e botão de logout
     (`useAuth().logout()`) — nova peça funcional, cobre lacuna real de
     ausência de logout no admin.
   - `_components/admin-header.tsx` — Server, chrome estático + embute
     `AdminMobileNav` e `AdminAccountMenu`.
   - `_components/admin-shell.tsx` — Server, composição sidebar fixa
     desktop + header + `<main>`.
5. **layout.tsx**: extensão mínima — manter `getSession()`/`redirect`/
   `AuthProvider` como está, passar a envolver `children` em `<AdminShell>`.
6. **Dashboard de dados (Visão geral)**:
   - `_components/dashboard-summary.tsx` — Client, `useQuery` com a
     **mesma** `adminWorksQueryKey`/`getAdminWorks()` já usada por
     `AdminWorkList` (cache compartilhado via `QueryClientProvider` global
     em `app/providers.tsx`, sem fetch duplicado); contagem
     publicado/rascunho via `useMemo` local; cards com
     `Card`/`CardHeader`/`CardContent` do Shadcn; tipografia Admin
     (`text-body-lg`/`text-label`, Manrope — nunca `heading-4`/Barlow
     Condensed); métricas limitadas a: total de works, publicados vs
     rascunho, comentários pendentes. Não inventar métricas adicionais.
   - `_components/pending-comments-list.tsx` — Client, `useQuery` com
     `adminCommentsQueryKey`/`getAdminComments` para listar comentários
     `PENDING`.
7. **Recompor `page.tsx`** (Server Component puro, sem `"use client"`):
   - Renomear `<h1>` de "Admin" para "Dashboard".
   - Seção 1 "Visão geral" → `<DashboardSummary />`.
   - Seção 2 "Works" → CTA "Novo trabalho" + `AdminWorkList` (inalterado).
   - Seção 3 "Comentários" → `PendingCommentsList` (novo) +
     `CommentModerationForm` (existente, mantido).
   - Layout: grid responsivo para cards (1 col mobile → 2-3 col desktop);
     `Container variant="page"` (não `"reading"`).
   - **Decisão em aberto a confirmar com o developer** (opcional, não
     obrigatória para o DoD desta task): clique num item de
     `PendingCommentsList` pré-preenche `commentId`/`workId` no
     `CommentModerationForm`. Se adotado, encapsular ambos em um único
     Client Component `_components/comments-panel.tsx` (`"use client"`),
     sem subir estado para `page.tsx`.
8. **Atualizar `comment-moderation-form.tsx`**: remover/atualizar o
   comentário obsoleto sobre a lacuna de listagem de comentários (o
   endpoint agora existe via `PendingCommentsList`). Sem mudança de
   contrato do componente.
9. **Testes colocalizados** (`*.test.tsx`/`*.test.ts`) para cada arquivo
   novo/alterado relevante listado acima (shell, nav, header,
   account-menu, dashboard-summary, pending-comments-list,
   comments.client, page.tsx recomposto).
10. **Validação manual**: subir o dev server e validar visualmente o
    dashboard (desktop e mobile/drawer), login/logout via
    `AdminAccountMenu`, estados de loading/erro/vazio das novas seções.

## Fora de escopo / não fazer

- Não criar rota nova — `/admin` continua sendo a home.
- Não inventar itens de menu além de "Dashboard" e "Novo trabalho" (nada de
  "Usuários"/"Configurações").
- Não inventar métricas além de total de works, publicados vs rascunho e
  comentários pendentes (nada de "visitas"/"conversão").
- Não reintroduzir tokens `--sidebar-*` em `app/globals.css` sem reabrir a
  decisão com o `architect`.
- Não usar o primitivo `sidebar` completo do Shadcn sem reabrir a decisão
  com o `architect` (decisão atual é composição manual).
- Não reaproveitar `Dialog` no lugar de `sheet` para o drawer mobile.
- Não usar `any`/`as any`/`@ts-ignore`/`@ts-expect-error` ou cast inseguro,
  especialmente ao tipar `getAdminComments` antes de o contrato estar
  confirmado.
- Não presumir Figma aprovado — se um aparecer, prevalece sobre esta
  decisão estrutural e deve ser escalado, não aplicado silenciosamente.

## Checklist de DoD técnico

- [ ] Bloqueio de contrato de `GET /admin/comments` confirmado antes da
      implementação de `lib/api/comments.client.ts` (Swagger/backend real,
      não suposição).
- [ ] `components/ui/sheet.tsx` instalado via `npx shadcn@latest add sheet`.
- [ ] `lib/api/comments.client.ts` criado com `adminCommentsQueryKey` e
      `getAdminComments`, tipagem estrita, sem `any`/cast inseguro.
- [ ] `_components/admin-nav-links.ts`, `admin-nav-link.tsx`,
      `admin-sidebar.tsx`, `admin-mobile-nav.tsx`, `admin-header.tsx`,
      `admin-account-menu.tsx` implementados conforme fronteiras
      Server/Client descritas.
- [ ] `admin-account-menu.tsx` exibe e-mail do usuário e permite logout via
      `useAuth().logout()`.
- [ ] `_components/admin-shell.tsx` implementado (Server) e `layout.tsx`
      atualizado para envolver `children` em `<AdminShell>`, mantendo
      `getSession()`/`redirect`/`AuthProvider` existentes.
- [ ] `_components/dashboard-summary.tsx` implementado, reaproveitando a
      MESMA `adminWorksQueryKey`/`getAdminWorks()` (sem fetch duplicado),
      com métricas limitadas a total de works, publicados vs rascunho e
      comentários pendentes, com tipografia Admin correta (Manrope,
      `text-body-lg`/`text-label`).
- [ ] `_components/pending-comments-list.tsx` implementado, consumindo
      `getAdminComments` para status `PENDING`.
- [ ] `page.tsx` recomposto: Server puro, `<h1>` renomeado para
      "Dashboard", 3 seções na ordem (Visão geral, Works, Comentários),
      `Container variant="page"`, grid responsivo de cards.
- [ ] `comment-moderation-form.tsx` com o comentário obsoleto sobre a
      lacuna de listagem atualizado/removido, sem mudança de contrato.
- [ ] Sidebar colapsa para `AdminMobileNav` (drawer via `sheet`) abaixo do
      breakpoint `lg`; navegação desktop fixa acima dele.
- [ ] Nenhum item de menu, métrica ou dado de negócio inventado além do
      explicitamente listado na decisão do `architect`.
- [ ] `app/globals.css` sem mudança a priori (tokens `--sidebar-*` e
      `--chart-*` não reintroduzidos).
- [ ] Strict TypeScript respeitado (sem `any`, `as any`, `@ts-ignore`,
      `@ts-expect-error`, ou cast inseguro) em todos os arquivos novos e
      alterados.
- [ ] Testes colocalizados criados/atualizados para cada arquivo novo ou
      alterado relevante, cobrindo estados de loading/erro/vazio das novas
      seções.
- [ ] Cobertura de código novo/alterado em pelo menos 80%, quando aplicável.
- [ ] Dev server iniciado e validado manualmente (desktop e mobile/drawer,
      login/logout, estados das novas seções) antes de reportar concluído.
- [ ] Decisão em aberto sobre clique-para-pré-preencher
      (`comments-panel.tsx`) explicitamente confirmada ou descartada pelo
      developer e reportada — não é obrigatória para o DoD, mas não deve
      ficar implementada parcialmente sem decisão registrada.
- [ ] Nenhum segredo, token ou valor real de `.env` exposto em código,
      comentários ou testes (`docs/rules/spec-security.md`).

## Observação de segurança

Nenhum segredo, token ou valor real de `.env` foi incluído neste plano, em
conformidade com `docs/rules/spec-security.md`.
