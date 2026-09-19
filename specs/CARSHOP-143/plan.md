# Plano de implementação — CARSHOP-143

Consolida `specs/CARSHOP-143/spec.md` (NON-TRIVIAL, conflitos já resolvidos
pelo usuário em 2026-09-18) e a decisão arquitetural do `architect`. Este
plano não introduz nenhuma decisão nova de arquitetura ou design — apenas
sequencia a implementação.

## Bloqueio/dependência a confirmar antes (ou durante) a implementação

- **CTA "Get a Quote" não tem rota/fluxo de orçamento implementado no
  backend/frontend.** Decisão já validada pelo usuário: o CTA deve existir
  visualmente (via `components/ui/button.tsx`, variante `default`), mas
  **sem navegação funcional real**. Seguir a recomendação do `architect`:
  renderizar como botão `disabled`/`aria-disabled="true"` com
  `aria-label="Get a Quote (coming soon)"` (texto exato pode ser ajustado
  pelo `developer` mantendo a intenção de "indisponível"), em vez de link
  para `"#"`. Isso evita: (a) inventar destino funcional, (b) problema de
  acessibilidade/scroll de `href="#"`.
  Esta dependência **não é implementada agora** — fica registrada como
  follow-up para quando existir rota/fluxo de orçamento aprovado.
- Nenhum outro blocker de dependência ausente foi identificado pelo
  `architect`.

## Arquivos impactados (ordem de implementação)

1. `components/layout/nav-links.ts`
2. `components/layout/mobile-nav.tsx`
3. `components/layout/header.tsx`
4. `components/layout/footer.tsx`
5. Testes: `mobile-nav.test.tsx`, `header.test.tsx`, `footer.test.tsx`,
   `layout.test.tsx` (caminho exato conforme localização atual dos specs
   desses componentes)

Não esperado sofrer alteração: `app/(public)/layout.tsx`,
`components/ui/button.tsx`, `app/globals.css`, `components/layout/container.tsx`
(reaproveitado sem mudança de contrato).

## Sequência de implementação

### 1. `components/layout/nav-links.ts`

- Remover o item `{ href: "/", label: "Início" }` (decisão do usuário: logo
  já cobre acesso à Home).
- Atualizar rótulos para inglês, seguindo `docs/design/`:
  - `/services` → `"Services"`
  - `/portfolio` → `"Our Work"`
  - `/about` → `"About"`
  - `/contact` → `"Contact"`
- Ordem final do array: Services, Our Work, About, Contact.
- Rotas mantidas como já existem no repositório (`/services`, `/portfolio`,
  `/about`, `/contact`) — nenhuma rota nova é criada.

### 2. `components/layout/mobile-nav.tsx`

- Continua `"use client"` (único Client Component do conjunto — boundary
  inalterada).
- Trocar o `<button>` cru do trigger por `<Button variant="ghost"
  size="icon">` de `components/ui/button.tsx`, preservando
  `aria-expanded`, `aria-controls="mobile-nav-panel"`, `aria-label`
  (pode manter texto em pt-BR ou trocar para inglês — não é requisito do
  DoD; se o `developer` alinhar todo o shell em inglês, ajustar aqui
  também por consistência, mas não é obrigatório pela spec) e
  `focus-visible:ring-3 focus-visible:ring-ring/50`. Garantir touch target
  ≥44x44px via `size="icon"` do `Button`.
- Ajustar itens do menu (`<Link>`) para `py-3` (touch target), mantendo
  `hover:bg-muted`, `focus-visible:ring-3 focus-visible:ring-ring/50`,
  `onClick` fechando o painel.
- Estender o painel (`#mobile-nav-panel`) para incluir a área de CTA:
  renderizar o mesmo `Button` "Get a Quote" (disabled/aria-disabled, ver
  seção de bloqueio acima) dentro do painel mobile, para que o CTA não
  fique escondido no mobile (exigência explícita do `architect`).
- Não introduzir estado adicional além do `isOpen` já existente; não criar
  "active nav state".

### 3. `components/layout/header.tsx`

- Mantém-se Server Component (sem `"use client"`).
- Estrutura final, com `Container` já existente:
  - Logo (`Link href="/"`) à esquerda.
  - Bloco à direita com `justify-between`/`justify-end` (conforme decisão
    do architect de "nav+CTA agrupados à direita"): nav desktop
    (`hidden md:flex`, usando `navLinks` já atualizado) + CTA area
    (`hidden md:flex`, `Button` "Get a Quote" disabled/aria-disabled) +
    `MobileNav` (visível apenas abaixo de `md`, já contém CTA próprio no
    painel).
- Aplicar `h-16` (header compacto), `bg-background` near-black,
  `border-b border-border`, seguindo `docs/design/components.md` (seção
  "Desktop Header").
- Hover dos links restrito a `hover:text-foreground/80` (sem glow/scale),
  `focus-visible:ring-3 focus-visible:ring-ring/50` em todos os itens
  interativos (links de nav e o próprio `Button` CTA).
- Reutilizar `Button` (variante `default`) para o CTA — mesmo componente
  usado no painel do `MobileNav`, sem duplicar estilos manualmente.

### 4. `components/layout/footer.tsx`

- Mantém-se Server Component.
- Estrutura final: nome/wordmark + copyright, nav institucional reusando o
  mesmo `navLinks` atualizado (Services, Our Work, About, Contact).
- Não incluir seção de contato, endereço, horário ou redes sociais
  (decisão do usuário — Conflito 3 da spec). Tagline editorial é opcional;
  se omitida, a base mínima (nome + copyright + nav) já atende ao DoD.
- Aplicar tokens de design já existentes (`app/globals.css`) para
  tipografia/cores, sem criar tokens novos.

### 5. Testes

Atualizar (não recriar do zero), cobrindo:

- `nav-links` atualizados: nenhuma referência a "Início"/pt-BR nos rótulos
  de nav em `header.test.tsx`, `footer.test.tsx`, `mobile-nav.test.tsx`,
  `layout.test.tsx`; usar os novos rótulos em inglês (Services, Our Work,
  About, Contact).
- `header.test.tsx`: assert de que o CTA "Get a Quote" está presente,
  visível apenas em `md:flex` (ou presente no DOM independentemente de
  classe, conforme padrão de teste já usado no repo), `disabled`/
  `aria-disabled="true"` e sem `href` funcional.
- `mobile-nav.test.tsx`: assert do trigger como `Button` (`role="button"`,
  ainda com `aria-expanded`/`aria-controls`), itens do menu com nova
  nomenclatura, e presença do CTA (mesmo estado disabled/aria-disabled)
  dentro do painel quando aberto.
- `footer.test.tsx`: assert de ausência de telefone/endereço/horário/redes
  sociais; assert de nome + copyright + nav com rótulos atualizados.
- `layout.test.tsx`: ajustar apenas asserções de texto/rótulo herdadas de
  `Header`/`Footer`; sem mudança estrutural em `app/(public)/layout.tsx`.

## Critérios de aceite mapeados ao DoD

| Critério do DoD (resumo) | Como o plano atende |
|---|---|
| Conformidade com `docs/design/` | Header/Footer/MobileNav seguem `visual-direction.md` e `components.md` (nav labels, header compacto, radius/shadow restritos, touch targets) |
| Hierarquia e acessibilidade de navegação (foco/hover/teclado) | `focus-visible:ring-3 focus-visible:ring-ring/50` mantido em todos os itens interativos; hover restrito; `aria-expanded`/`aria-controls`/`aria-label` preservados no `MobileNav`; trigger vira `Button size="icon"` para touch target ≥44px |
| CTA consistente e não genérico | CTA único (`Button` variante `default`) reaproveitado no header desktop e painel mobile; sem link para rota inexistente; `disabled`/`aria-disabled` com `aria-label` explicando indisponibilidade |
| Responsividade sem overflow | Breakpoint `md` mantido; nav desktop `hidden md:flex`; `MobileNav` cobre mobile incluindo CTA; nenhum layout intermediário novo para tablet |
| Footer sem dados inventados | Footer final restrito a nome/copyright/nav institucional; nenhuma seção de contato/redes sociais/endereço adicionada |
| Nenhuma rota/integração quebrada | Rotas de `navLinks` mantidas (`/services`, `/portfolio`, `/about`, `/contact`); nenhuma rota nova criada; CTA não aponta para rota inexistente |
| Lint/typecheck/build/testes passando | Testes listados acima atualizados antes de considerar a tarefa concluída; nenhum `any`/cast inseguro introduzido |

## Fora de escopo (reforço, não implementar agora)

- Rota/fluxo real de "Get a Quote" (dependência registrada acima).
- Dados reais de negócio no footer (telefone, endereço, horário, redes
  sociais).
- Qualquer nova rota pública.
- Mudança de Server/Client boundary além do que já existe hoje
  (`MobileNav` já é o único Client Component).
- Reabertura de CARSHOP-22.
