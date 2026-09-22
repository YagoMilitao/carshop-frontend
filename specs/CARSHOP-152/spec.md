# CARSHOP-152 — Criar home/dashboard do admin

## Origem
Task Notion CARSHOP-152 (Stack: Frontend · Component: Admin UI · Priority:
Medium · Status: Backlog). Ver Description/DoD/Technical Notes originais no
Notion — não duplicados aqui.

## Resumo do pedido (Notion)
O login do admin redireciona para `/admin`, e essa rota supostamente "ainda
não tem uma home/dashboard definida como ponto de entrada" da área
administrativa. O Technical Notes registra explicitamente que o escopo de
conteúdo (atalhos para gestão de works, métricas, avisos etc.) depende de
decisão do `architect`, sem presumir conteúdo de negócio.

## CONFLITO A SINALIZAR AO USUÁRIO (bloqueante para seguir sem validação)

A premissa da task no Notion **não confere com o estado atual do
repositório**:

- `app/(admin)/admin/login/page.tsx` já redireciona para `/admin` após login
  (`router.push("/admin")`).
- `app/(admin)/admin/(protected)/page.tsx` **já existe** e já é renderizado
  como o ponto de entrada de `/admin` (protegido por
  `app/(admin)/admin/(protected)/layout.tsx`, que faz `redirect` para
  `/admin/login` quando não há sessão).
- Esse `page.tsx` **já tem conteúdo funcional**, não é uma rota vazia/404:
  - título "Admin";
  - seção "Works" com lista (`AdminWorkList`, via TanStack Query +
    `getAdminWorks`) e botão "Novo trabalho" (`/admin/trabalhos/novo`);
  - seção "Moderar comentário" (`CommentModerationForm`).

Ou seja, a home do admin **já existe e já tem escopo mínimo de conteúdo**
(atalho de works + moderação de comentário) — o que a Description da task
supõe que não exista ainda.

Duas leituras possíveis, e a decisão de qual seguir **não deve ser tomada
unilateralmente pelo spec-writer**:

1. A task é sobre **evoluir/redesenhar** essa home já existente para um
   dashboard mais completo (ex.: métricas, avisos, navegação admin mais
   estruturada), e a Description do Notion está desatualizada quanto ao
   estado do código.
2. A task já está **de fato satisfeita** pelo estado atual do código e só
   falta confirmar/formalizar isso (ex.: ajustes pontuais de UI), sem
   justificar um redesenho.

Também não existe hoje nenhuma navegação/shell admin (sidebar, header com
links, breadcrumbs) fora do conteúdo da própria página — não há
`nav`/`Sidebar`/`Header` em `app/(admin)`. Se o dashboard exigir navegação
estruturada entre seções admin, isso é uma decisão de arquitetura adicional
não coberta pela Description atual.

**Recomendação**: antes de acionar `architect`/`plan-writer`, confirmar com
o usuário/produto qual das duas leituras acima é a correta, e se o escopo
inclui introduzir uma navegação/shell admin.

## Estado atual relevante do repositório

- Rota: `app/(admin)/admin/(protected)/page.tsx` (Server Component, sem
  `"use client"`), com `metadata.robots = { index: false, follow: false }`
  (defesa em profundidade contra indexação, redundante com
  `app/(admin)/admin/layout.tsx`).
- Proteção de sessão: `app/(admin)/admin/(protected)/layout.tsx` (Server
  Component, `export const dynamic = "force-dynamic"`, usa `getSession()` de
  `lib/api/auth.server` e faz `redirect("/admin/login")` se não houver
  sessão; envolve `children` em `<AuthProvider initialUser={session.user}>`).
- Componentes já usados na home atual:
  - `AdminWorkList` (`app/(admin)/admin/(protected)/admin-work-list.tsx`) —
    Client Component, `useQuery` com `adminWorksQueryKey` /
    `getAdminWorks` de `lib/api/works.client`; estados de loading (`<output>`),
    erro (`getApiErrorMessage`) e lista vazia já tratados.
  - `CommentModerationForm` (`.../comment-moderation-form.tsx`).
  - `WorkListItem` (`.../work-list-item.tsx`).
- Padrões de layout usados: `Container` e `PageSection` de
  `components/layout/*`, classes utilitárias Tailwind (`text-heading-2`,
  `text-body-lg`, `text-body-sm`, `text-destructive-text` etc.) — mesmo
  vocabulário de design tokens do restante do app.
- Não há nenhum componente de navegação admin (sidebar/topbar) nem rota
  `/admin` "dashboard" separada da atual — a home e a listagem de works
  convivem na mesma página.
- Endpoints/dados já integrados no admin: `getAdminWorks` (works do admin,
  via `lib/api/works.client`), moderação de comentários (via
  `comment-moderation-form.tsx`). Nenhum endpoint de métricas/analytics é
  consumido hoje pelo admin.

## Escopo (sujeito à resolução do conflito acima)
Não presumir conteúdo de negócio (métricas, avisos, atalhos adicionais) —
conforme o próprio Technical Notes da task. O `architect` é quem decide:

- se a home atual é mantida como base e apenas reestruturada/expandida, ou
  se há uma reformulação maior de composição;
- Server vs Client Components para as novas seções, se houver;
- se é necessário introduzir navegação/shell admin (sidebar/header) — hoje
  inexistente;
- boundaries de componentes para qualquer seção nova (ex.: cards de
  métricas, avisos) — apenas se o escopo confirmado incluir isso.

## Critérios de aceite
Não definidos no Notion (DoD não definido). Não presumidos aqui — dependem
da resolução do conflito de escopo acima e da decisão do `architect`.

## Classificação de tamanho: NON-TRIVIAL

Justificativa:
- Envolve decisão de arquitetura explícita e obrigatória segundo o próprio
  Technical Notes da task (escopo/estrutura da home depende do `architect`).
- Potencialmente afeta múltiplas áreas: a página de entrada existente,
  possível introdução de navegação/shell admin (novo componente
  compartilhado entre rotas admin), e composição de novas seções.
- Há um conflito de premissa entre a Description do Notion e o estado real
  do código que precisa ser resolvido antes de qualquer implementação —
  risco de retrabalho se não for esclarecido.

## Próximos agentes necessários
- **`knowledge-reader`**: consultar o vault Obsidian
  (`/Users/yagomilitao/DEV/YagoMilitao/CarShop`) por decisões/histórico
  prévios sobre admin UI, dashboard ou navegação admin, antes do `architect`
  decidir.
- **`architect`** (obrigatório): decidir estrutura/composição da home admin,
  Server vs Client Components, necessidade de shell/navegação admin, e
  boundaries de componentes — **após** o conflito de escopo acima ser
  esclarecido com o usuário.
- **`plan-writer`** (obrigatório, task NON-TRIVIAL): persistir `plan.md`
  com base na decisão do `architect`.

## Observação de segurança
Nenhum segredo, token ou valor real de `.env` foi incluído nesta spec, em
conformidade com `docs/rules/spec-security.md`.
