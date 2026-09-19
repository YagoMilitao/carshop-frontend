# CARSHOP-143 — Redesenhar Header, Footer e navegação pública

Notion: https://app.notion.com/p/3df765c3f0d4816cbbeef82bde839648
Status Notion: To Do | Priority: High | Sprint 5 | Points: 3 | Component: Public UI

## Resumo

Refatoração **visual** do shell público existente (`Header`, `Footer`,
navegação desktop/mobile) para alinhar com a direção "American Automotive
Craftsmanship" descrita em `docs/design/`, preservando App Router, rotas e
comportamento funcional atuais. Ver Description/DoD/Technical Notes completos
no Notion (não duplicados aqui).

## Estado atual do repositório (confirmado)

- `components/layout/header.tsx` — header minimalista genérico: logo texto
  "CarShop", nav desktop (`ul`/`li` com `text-nav`), `MobileNav`. Sem CTA.
- `components/layout/footer.tsx` — footer minimalista: nome, copyright, nav
  institucional reaproveitando `navLinks`. **Sem** telefone, endereço,
  horário ou redes sociais.
- `components/layout/mobile-nav.tsx` — menu mobile client component com
  toggle, painel absoluto, `aria-expanded`/`aria-controls`, foco visível via
  `focus-visible:ring`. Já usa `lucide-react` (Menu/X).
- `components/layout/nav-links.ts` — links atuais: Início, Sobre, Serviços,
  Portfólio, Contato (rotas `/`, `/about`, `/services`, `/portfolio`,
  `/contact`). Divergem da nomenclatura de `docs/design/visual-direction.md`
  (Services, Our Work, About, Contact) — ver seção "Conflito" abaixo.
- `app/(public)/layout.tsx` — compõe `Header` + `main` + `Footer`, App Router,
  sem lógica adicional.
- `components/ui/button.tsx` — já existe `Button` (cva) com variantes
  `default`/`outline`/`secondary`/`ghost`/`destructive`/`link` usando tokens
  `bg-primary`/`bg-secondary`. Nenhum CTA de header/footer usa `Button` hoje.
- Testes existentes: `header.test.tsx`, `footer.test.tsx`, `mobile-nav.test.tsx`,
  `layout.test.tsx` (App Router `(public)`) — cobrem estrutura atual e
  precisarão ser atualizados/estendidos, não recriados do zero.
- Commit recente `33c1a18 feat: Refactor UI components and implement new
  design tokens` já introduziu tokens de design (`app/globals.css`,
  `text-heading-4`, `text-nav`, `text-button`, cores via CSS vars) — esta é a
  "nova fundação visual da Sprint 5" citada nas Technical Notes. O redesign
  desta task deve **reutilizar** esses tokens, não criar um sistema paralelo.
- CARSHOP-22 (Done) é histórico da implementação original do shell público;
  não deve ser reaberta, apenas usada como referência de contexto.

## Fontes de design consultadas (referenciadas, não duplicadas)

- `docs/design/visual-direction.md` — direção "American Automotive
  Craftsmanship", seção "Header" (nav: Services, Our Work, About, Contact;
  CTA opcional "Get a Quote"; header minimalista que não compete com o hero).
- `docs/design/components.md` — seções "Desktop Header", "Mobile Navigation",
  "Buttons" (Primary/Secondary/Text Action, radius restrito, sem gradiente/
  glow/pill), "Accessibility", "Touch Targets", "Component Radius", "Shadows".
- Nenhum Figma aprovado foi localizado no repositório para este componente
  específico; na ausência de Figma, `docs/design/` é a fonte de maior
  prioridade.

## Conflitos — resolvidos pelo usuário (2026-09-18)

1. **Idioma e rótulos de navegação**: **decisão do usuário: renomear para
   inglês**, seguindo `docs/design/` (Services, Our Work, About, Contact).
   `nav-links.ts` deve ser atualizado (rótulos; rotas mantidas ou ajustadas
   apenas na medida do necessário para refletir os novos rótulos — sem criar
   páginas novas).
2. **CTA principal ("Get a Quote")**: **decisão do usuário: bloquear/registrar
   como dependência**. O CTA deve ser implementado visualmente (estilo do
   design system, via `Button`), mas **sem** link funcional para uma rota de
   orçamento inexistente. Tratar como placeholder não navegável (ou navegando
   para `#`/rota neutra existente) e registrar explicitamente a dependência
   de uma rota/fluxo de orçamento futuro. Não inventar destino funcional.
3. **Informações reais de negócio no Footer**: **decisão do usuário: footer
   sem esses dados por enquanto**. O footer redesenhado não deve incluir
   telefone, endereço, horário ou redes sociais. Manter apenas informações já
   reais (nome, copyright, navegação institucional), sem seção de "Business
   Information"/contato até existir fonte oficial.

## Escopo da mudança

Dentro do escopo (visual, mantendo contrato funcional):
- Reestilizar `Header` (logo, navegação desktop, área de CTA) usando tokens
  já existentes em `app/globals.css` e padrões de `docs/design/components.md`.
- Reestilizar `Footer` conforme direção editorial/industrial, sem inventar
  dados de negócio (ver Conflito 3).
- Reestilizar `MobileNav` mantendo comportamento de toggle, `aria-expanded`,
  foco e tamanho de toque (~44x44px), alinhando visual ao design system.
- Ajustar `nav-links.ts` para os rótulos em inglês (Services, Our Work,
  About, Contact) conforme decisão do usuário (Conflito 1).
- Adicionar CTA principal visual no Header usando `Button` (variante
  consistente com o design system), sem link funcional para rota de
  orçamento inexistente (Conflito 2 — dependência registrada abaixo).
- Garantir responsividade (mobile/tablet/desktop) sem overflow/quebra.
- Atualizar testes afetados (`header.test.tsx`, `footer.test.tsx`,
  `mobile-nav.test.tsx`, `layout.test.tsx`) para refletir a nova estrutura,
  preservando cobertura de acessibilidade e navegação.

Fora do escopo:
- Criar novas rotas públicas (ex.: página de quote) sem confirmação.
- Implementar destino funcional real do CTA de orçamento (dependência em
  aberto — ver Conflito 2).
- Adicionar dados reais de negócio no footer (dependência em aberto — ver
  Conflito 3).
- Alterar arquitetura de rendering (Server/Client Components) além do que já
  existe (`MobileNav` já é `"use client"`).
- Reabrir/duplicar CARSHOP-22.
- Backend/API — não há integração de backend envolvida neste shell.

## Definition of Done (referência)

Ver DoD completo no Notion CARSHOP-143. Resumo dos critérios técnicos
observáveis no repositório: conformidade com `docs/design/`, hierarquia e
acessibilidade de navegação (foco/hover/teclado), CTA consistente e não
genérico, responsividade sem overflow, footer sem dados inventados, nenhuma
rota/integração quebrada, lint/typecheck/build/testes passando.

## Classificação de tamanho: NON-TRIVIAL

Justificativa:
- Múltiplos arquivos/componentes afetados (`header.tsx`, `footer.tsx`,
  `mobile-nav.tsx`, `nav-links.ts`, respectivos testes, possivelmente
  `container.tsx`).
- Envolve decisão de estrutura visual (arquitetura de UI: composição do
  header/footer, boundary de componentes, uso do `Button` compartilhado) que
  cabe ao `architect` por definição do `CLAUDE.md` ("architect owns UI
  structure and design decisions when the task involves UI").
- Existem conflitos de escopo reais (idioma de navegação, destino do CTA,
  dados de negócio do footer) que precisam de decisão explícita antes da
  implementação — não podem ser resolvidos silenciosamente pelo spec-writer.
- Requisitos de compliance visual, responsividade e acessibilidade
  atravessam múltiplas áreas (header, footer, nav mobile) simultaneamente.

## Próximos agentes necessários

1. **knowledge-reader** — recomendado, para verificar no Obsidian se há
   notas/decisões anteriores sobre o shell público, CARSHOP-22, ou tokens de
   design da Sprint 5 que ajudem a evitar retrabalho.
2. **architect** — obrigatório, dado o caráter NON-TRIVIAL e a necessidade de
   decisão de estrutura visual (composição do header/footer, uso do `Button`
   para o CTA, estratégia responsiva, boundaries de componente) alinhada a
   `docs/design/` e às definições de rendering do projeto.
3. **plan-writer** — obrigatório (NON-TRIVIAL): plano formal em
   `specs/CARSHOP-143/plan.md` antes da implementação, cobrindo a resolução
   dos conflitos listados (ou explicitando que ficam como follow-up/bloqueio)
   e a sequência de mudanças em cada componente/teste.

## Ação recomendada antes de prosseguir

Concluída — os 3 conflitos foram levados ao usuário e resolvidos em
2026-09-18 (ver seção "Conflitos — resolvidos pelo usuário"). Escopo
definitivo liberado para `architect`/`plan-writer`.
