# Spec — CARSHOP-22: Criar layout público (Header/Footer)

## Referência

Ver dados completos da tarefa no Notion (Task Tracker), ID `CARSHOP-22`,
Epic "Frontend Base", Sprint 3, Priority Medium, Stack Frontend. Esta spec
resume o essencial para implementação sem duplicar a Description/DoD.

## Estado atual do repositório (inspecionado antes desta spec)

- `app/(public)/layout.tsx` já existe, mas é apenas um passthrough:
  ```tsx
  export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
    return <>{children}</>
  }
  ```
  com teste em `app/(public)/layout.test.tsx` que hoje só verifica a
  renderização dos `children`.
- O grupo de rota `(public)` já engloba as páginas públicas relevantes:
  `app/(public)/page.tsx`, `app/(public)/about/page.tsx`,
  `app/(public)/contact/page.tsx`, `app/(public)/services/page.tsx`,
  `app/(public)/portfolio/page.tsx` e `app/(public)/portfolio/[slug]/page.tsx`.
  Isso significa que, ao popular `PublicLayout` com Header/Footer, **todas**
  essas páginas herdam o layout automaticamente — não é necessário editar
  cada `page.tsx`.
- Não existe nenhum componente `Header`/`Footer`/`Nav` no repositório hoje
  (`app/(admin)/...` também não tem; o layout admin protegido apenas
  envolve os children com `AuthProvider`).
- Stack de UI confirmada instalada em `package.json`: TailwindCSS,
  Shadcn/UI (`components/ui/button.tsx` usa `class-variance-authority`,
  helper `cn`, `radix-ui`), convenção de arquivo kebab-case com teste
  colocalizado (`button.tsx` + `button.test.tsx`).
- React Router não está presente (`react-router-dom` não consta em
  `package.json`); App Router é a única solução de rotas em uso, conforme
  `docs/rules/routing.md`.

Nenhum conflito de escopo foi identificado entre a Description/DoD da
tarefa e o estado real do repositório: a premissa "migração para Next.js
concluída" é verdadeira, e a estrutura `app/(public)/layout.tsx` já está
pronta para receber o Header/Footer sem necessidade de decisão
arquitetural adicional sobre onde plugar o layout.

## Escopo da implementação

1. Criar componentes reutilizáveis `Header` e `Footer`:
   - Local sugerido: `components/layout/header.tsx` e
     `components/layout/footer.tsx` (mesmo padrão kebab-case + teste
     colocalizado usado em `components/ui/`), já que são componentes de
     layout compartilhados e não específicos de um segmento de rota.
   - `architect` deve confirmar/ajustar esse local se preferir outra
     convenção (ex.: `app/(public)/_components/`), mas a spec assume
     `components/layout/` por alinhamento com a organização já existente
     em `components/ui/`.
2. Integrar `Header` e `Footer` em `app/(public)/layout.tsx`, envolvendo
   `children`, substituindo o passthrough atual.
3. Navegação do `Header` cobrindo as rotas públicas já existentes (Home,
   Sobre, Serviços, Portfólio, Contato), usando `next/link`.
4. Responsividade via Tailwind (mobile-first, conforme
   `docs/rules/responsive.md`).
5. Acessibilidade básica conforme `docs/rules/accessibility.md`: elementos
   semânticos (`<header>`, `<nav>`, `<footer>`), navegação por teclado
   funcional, foco visível, contraste adequado.
6. Decisão Server vs Client Component para `Header`/`Footer` fica a cargo
   do `architect` (provável Server Component por padrão, exceto se houver
   necessidade de interatividade client-side, ex. menu mobile com estado).
7. Atualizar/estender `app/(public)/layout.test.tsx` para refletir a
   presença de Header/Footer, além de testes próprios para os novos
   componentes.

## Fora de escopo

- Qualquer alteração no layout admin (`app/(admin)/...`).
- Migração ou reintrodução de React Router (explicitamente proibido).
- Design visual definitivo/Figma — na ausência de design aprovado citado
  na tarefa, seguir consistência visual com os componentes Shadcn/UI já
  existentes (ver `docs/rules/ui-design-system.md`).

## Critérios de aceite (derivados do DoD do Notion)

- Todas as páginas públicas relevantes usam o layout compartilhado do
  Next.js (herdado automaticamente via `app/(public)/layout.tsx`).
- Header/Footer funcionam de forma responsiva, sem dependência de React
  Router.
- Componentes reutilizáveis (não duplicados por página).

## Riscos / pontos de atenção

- Não introduzir React Router nem qualquer padrão de rotas alternativo.
- Respeitar boundary Server/Client Components — decisão do `architect`.
- Garantir que o layout admin não seja afetado (grupos de rota `(public)`
  e `(admin)` são independentes).

## Classificação de tamanho

**SMALL** — escopo bem definido, concentrado em poucos arquivos
(`app/(public)/layout.tsx` + 2 novos componentes `Header`/`Footer` + testes
colocalizados), sem necessidade de decisão arquitetural complexa (a
integração ao App Router já está pronta, é só popular o layout existente).
Não há mudança de arquitetura, múltiplas áreas do sistema ou integração
com backend. Plano formal via `plan-writer` é opcional.

## Próximos agentes necessários

- `knowledge-reader`: recomendado, opcional — pode valer a pena checar no
  Obsidian (`CarShop/Architecture`, `CarShop/Patterns`) se já existe algum
  ADR/padrão definido para layout público, navegação ou Header/Footer
  antes da implementação, para evitar retrabalho.
- `architect`: recomendado para confirmar (a) localização final dos
  componentes (`components/layout/` vs. colocado em `app/(public)/`) e
  (b) decisão Server vs Client Component do Header (especialmente se
  houver menu mobile com estado).
- `plan-writer`: não obrigatório (tarefa SMALL), pode ser pulado a
  critério do fluxo.
