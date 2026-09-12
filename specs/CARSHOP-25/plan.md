# Plano de implementação — CARSHOP-25 (Galeria de imagens)

## Referência

Baseado em `specs/CARSHOP-25/spec.md` e na decisão do `architect` (grid
Tailwind + Radix Dialog via `radix-ui`, já instalado, + Framer Motion;
sem novas dependências). Este plano não reabre nenhuma decisão já
tomada — apenas ordena a implementação.

## Pré-requisito obrigatório (bloqueio a resolver antes de tudo)

`next.config.mjs` está vazio (`{}`) e não possui `images.remotePatterns`.
O `next/image` vai falhar em runtime para qualquer imagem servida via
Cloudinary (`res.cloudinary.com`, confirmado pelo usuário) sem esse
ajuste. Este é o **passo 0**, obrigatório antes de qualquer componente
usar `next/image`:

1. Editar `next.config.mjs` para adicionar:
   ```js
   images: {
     remotePatterns: [
       { protocol: 'https', hostname: 'res.cloudinary.com' },
     ],
   }
   ```
2. Durante a implementação, verificar no código/env se há um cloud name
   específico do Cloudinary disponível (ex.: variável de ambiente ou
   `publicId`/URL já persistidos em `WorkImage`) para decidir se vale
   restringir por `pathname` (ex.: `/<cloud_name>/**`). Se não houver
   informação suficiente, manter o hostname genérico e seguir em frente
   — não é um bloqueio para o restante da task, mas deve ser registrado
   como decisão tomada durante a implementação (não pelo `plan-writer`).
3. Rodar o build/dev local após a alteração para confirmar que o Next
   não rejeita `next.config.mjs` (sintaxe válida) antes de prosseguir.

## Ordem de implementação

### 1. `next.config.mjs`
Ver "Pré-requisito obrigatório" acima. Deve ser o primeiro commit lógico
da task, isolado dos componentes de galeria.

### 2. Gerar o wrapper Shadcn do Dialog
- Rodar `npx shadcn add dialog` para gerar `components/ui/dialog.tsx`.
- Não é uma nova dependência (`radix-ui` já está no `package.json`); é
  apenas o wrapper de convenção do projeto. Nunca escrever
  `components/ui/*` manualmente (ver padrão existente em
  `components/ui/button.tsx`).
- Conferir se o gerador também adiciona algum utilitário novo (ex.:
  `components/ui/*` auxiliares) e se colide com algo já existente antes
  de aceitar o diff.

### 3. `components/gallery/work-image-thumb.tsx` (+ `.test.tsx`)
- **Server Component** (sem `"use client"`, sem estado/evento).
- Wrapper puro de `next/image`: aspect-ratio fixo, `object-cover`, `alt`
  com fallback (`image.alt || work.title` ou equivalente definido no
  contrato de props — decidir a props shape de forma que sirva tanto ao
  grid quanto à listagem de capa).
- `sizes` refletindo os breakpoints do grid Tailwind, ex.:
  `sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"`.
- Sem `priority` por padrão (lazy). Avaliar `priority` apenas se for a
  primeira imagem/capa acima da dobra (opcional, não bloqueante pelo
  DoD).
- Nome deliberadamente distinto do tipo `WorkImage` (`lib/api/works.ts`)
  para não colidir no import.
- Teste (Testing Library): renderiza `next/image` com `src`/`alt`
  corretos, aplica fallback de `alt` quando ausente, não deve conter
  nenhum comportamento client (evitar `render` + eventos, é só render
  estático). Seguir `docs/rules/testing.md`.

### 4. `components/gallery/gallery-lightbox.tsx` (+ `.test.tsx`)
- **Client Component** (`"use client"`).
- Props: `images`, `selectedIndex`, `onOpenChange`, `onNavigate`
  (assinatura exata a decidir na implementação, mantendo o contrato já
  definido pelo `architect`).
- Radix `Dialog` (via `components/ui/dialog.tsx` gerado no passo 2) +
  Framer Motion para transição de entrada/saída e/ou troca de imagem.
- Imagem do lightbox: `next/image` com `sizes="100vw"`, sem `priority`
  (só monta quando o dialog abre).
- Acessibilidade (`docs/rules/accessibility.md`): navegação por teclado
  (setas para avançar/voltar, Esc para fechar — Radix Dialog já cobre
  Esc/focus trap nativamente), `aria-label`/`DialogTitle` adequados,
  foco devolvido ao elemento que abriu o lightbox ao fechar.
- Teste: abre/fecha via prop `isOpen`/`onOpenChange`, navegação
  (`onNavigate` chamado corretamente ao clicar/teclado), imagem exibida
  corresponde a `selectedIndex`.

### 5. `components/gallery/work-gallery.tsx` (+ `.test.tsx`)
- **Client Component** (`"use client"`).
- Recebe `images: WorkImage[]`, ordena por `order`.
- Grid responsivo via Tailwind (`grid-cols-*` com breakpoints —
  `docs/rules/responsive.md`), renderiza um `WorkImageThumb` por imagem.
- Mantém estado local `selectedIndex`/`isOpen`; `onClick` por imagem
  abre o `GalleryLightbox` na imagem correspondente.
- Compõe `GalleryLightbox` internamente, repassando `images`,
  `selectedIndex`, `onOpenChange`, `onNavigate`.
- Teste: grid renderiza uma miniatura por imagem ordenada
  corretamente por `order`; clique em uma miniatura abre o lightbox no
  índice certo; navegação entre imagens atualiza `selectedIndex`.

### 6. Integração em `app/(public)/portfolio/[slug]/page.tsx`
- Continua **Server Component** — nenhuma mudança de rendering mode.
- Renderizar `<WorkGallery images={work.images} />` no corpo da página
  (hoje só tem `<h1>`/`<p>`/comentários — inserir a galeria em local
  apropriado, ex.: logo após o título/descrição, antes da seção de
  comentários).
- Não alterar `generateMetadata`/`getCoverImage` (já usados só para
  OpenGraph, fora de escopo).
- Atualizar `page.test.tsx` existente: garantir que a galeria é
  renderizada (mock de `getWorks`/`getWorkBySlug` já existente deve
  incluir `images` populado) sem quebrar as asserções atuais de
  comentários/metadata.

### 7. Reaproveitamento em `app/(public)/portfolio/page.tsx`
- Continua **Server Component**.
- Reaproveitar **apenas** `WorkImageThumb` (sem grid multi-imagem, sem
  lightbox) para exibir a imagem de capa de cada `work`
  (`getCoverImage(work)`, já existente) ao lado do link de texto atual.
- Se `getCoverImage(work)` retornar `undefined` (work sem capa), decidir
  fallback simples (ex.: omitir a miniatura para aquele item) — não
  travar a listagem.
- Atualizar `page.test.tsx` existente para cobrir a miniatura de capa
  sem quebrar as asserções de listagem/link já existentes.

### 8. Revisão final de regras transversais
- `docs/rules/rendering.md`: confirmar que só `work-gallery.tsx` e
  `gallery-lightbox.tsx` têm `"use client"`; `work-image-thumb.tsx` e as
  duas páginas seguem Server.
- `docs/rules/accessibility.md`: revisar navegação por teclado, foco e
  `alt` text em todos os componentes novos.
- `docs/rules/responsive.md`: validar grid em mobile/tablet/desktop
  (breakpoints Tailwind já usados no projeto).
- `docs/rules/testing.md`: garantir cobertura ≥80% no código
  novo/alterado e que nenhum teste existente
  (`portfolio/[slug]/page.test.tsx`, `portfolio/page.test.tsx`) regride.

## Arquivos a criar

- `components/gallery/work-image-thumb.tsx`
- `components/gallery/work-image-thumb.test.tsx`
- `components/gallery/work-gallery.tsx`
- `components/gallery/work-gallery.test.tsx`
- `components/gallery/gallery-lightbox.tsx`
- `components/gallery/gallery-lightbox.test.tsx`
- `components/ui/dialog.tsx` (gerado via `npx shadcn add dialog`, não
  escrito manualmente)

## Arquivos a alterar

- `next.config.mjs` (passo 0, `images.remotePatterns` para
  `res.cloudinary.com`)
- `app/(public)/portfolio/[slug]/page.tsx` (renderizar `WorkGallery`)
- `app/(public)/portfolio/[slug]/page.test.tsx` (cobrir galeria, sem
  regressão)
- `app/(public)/portfolio/page.tsx` (reaproveitar `WorkImageThumb` para
  a capa)
- `app/(public)/portfolio/page.test.tsx` (cobrir miniatura de capa, sem
  regressão)

## Critérios de aceite (para o `tester`/`reviewer` validarem)

1. Página de detalhe do Work exibe as imagens em grid responsivo.
2. Clicar em uma imagem abre-a em destaque (lightbox), navegável e
   fechável via teclado, com atributos de acessibilidade corretos.
3. Layout responsivo em mobile/tablet/desktop.
4. Miniaturas do grid e imagem de capa da listagem carregam com lazy
   loading (sem `priority`, exceto avaliação opcional da capa acima da
   dobra); imagem do lightbox só monta ao abrir.
5. Nenhuma regressão em `portfolio/[slug]/page.test.tsx` e
   `portfolio/page.test.tsx`.
