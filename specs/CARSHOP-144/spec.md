# CARSHOP-144 — Redesenhar Home pública com foco em craftsmanship automotivo

## Referência

Tarefa no Notion: CARSHOP-144. Description, DoD (9 itens) e Technical Notes
completos na tarefa — aqui só o essencial.

Sprint 6 · Priority High · Component: Public UI · Epic: Frontend Público ·
5 points · Branch `feat/CARSHOP-144` · **Sem Figma aprovado localizado**
(fonte visual autoritativa: `docs/design/*`, em especial
`visual-direction.md` → "Homepage Direction" e seções seguintes,
`components.md` → "Services", "Project Presentation", "Portfolio Grid",
"Before & After", "Trust Signals", "Testimonials", "Business Information",
"CTA Section", "Homepage Component Map", `imagery.md` → "Hero Imagery",
"Homepage Imagery Map", "Performance", "Layout Shift", "Placeholder
Strategy", "Content Authenticity").

Relacionadas: CARSHOP-142 (tokens/primitives), CARSHOP-143 (shell público —
decisões sobre CTA "Get a Quote" e dados de negócio reaproveitadas aqui),
CARSHOP-34/35 (portfolio e Project Details).

Resumo do objetivo: substituir a Home placeholder por uma composição
editorial "American Automotive Craftsmanship", com fotografia real como
prova de trabalho e hierarquia forte, **sem** padrões SaaS e **sem** inventar
copy factual, reviews, ratings, endereço, telefone, horários, estatísticas
ou garantias (Technical Notes). Preservar contratos e integrações existentes.

## Estado atual do repositório (investigação)

### Home

- `app/(public)/page.tsx` é um **placeholder** síncrono: `PageSection` com
  `h1` "CarShop" e "Página inicial — em construção.". Não há Home anterior a
  "refatorar" — na prática é uma construção nova (ver Conflito 1).
- `app/(public)/page.test.tsx` só cobre o placeholder; será reescrito.
- Não há metadata específica da Home no arquivo.

### Shell e primitives disponíveis (não refazer)

- Shell público (CARSHOP-143): `Header` com CTA "Get a Quote" **desabilitado**
  (`aria-disabled`, sem destino — dependência registrada), `Footer` sem dados
  de negócio (decisão do usuário), `navLinks`: Services, Our Work
  (`/portfolio`), About, Contact.
- Layout: `components/layout/page-section.tsx` (spacing `editorial`/
  `standard`/`compact`, `container`), `container.tsx` (`page`/`reading`).
- UI: `button`, `badge`, `card`, `skeleton` etc. em `components/ui/`.
- Imagem: `components/gallery/work-image-thumb.tsx` (wrapper `next/image`
  com `fill`, `sizes`, `priority` opcional, hoje fixo em `aspect-square` +
  `rounded-lg` sobrescrevível por `className`).
- Tipografia: Barlow Condensed (`--font-heading`, `text-display-*`,
  `text-heading-1..3`) e Manrope (`--font-sans`) já configuradas em
  `app/layout.tsx` / `app/globals.css`.
- `next.config.mjs`: `images.remotePatterns` só para `res.cloudinary.com`.
- `public/` **não contém nenhuma imagem** (nenhum asset estático de hero,
  workshop ou placeholder).

### Dados realmente disponíveis

| Conteúdo | Fonte real | Situação |
| --- | --- | --- |
| Projetos/portfolio | `getWorks()` em `lib/api/works.ts` (`GET /works`, Server-only, ISR 1h, tag `works`, retry) | Disponível: `id`, `slug`, `title`, `description`, `category`, `tags`, `images[]` (`url` Cloudinary, `alt`, `isCover`, `order`). **Sem** campo `featured`/destaque, sem ordenação por relevância. Capa via `getCoverImage()`. Navegação para `/portfolio` e `/portfolio/[slug]` já existe. |
| Serviços | Nenhuma | Não há endpoint nem conteúdo. `/services` é placeholder. `docs/design/` cita Restoration / Custom Interiors / Repairs como direção aprovada, mas `components.md` exige que "o conteúdo reflita os serviços reais" (Conflito 3). |
| Before/after | Nenhuma | `WorkImage` não tem campo de estado (antes/depois) nem pareamento. Não é possível identificar before/after sem inferir de alt/ordem — proibido (`imagery.md`). Seção **não** deve ser renderizada. |
| Testimonials / ratings | Nenhuma aprovada | Só existem comentários públicos aprovados por work (`GET /works/{workId}/comments`, `authorName`, `content`). São comentários de projeto, não depoimentos aprovados como claim de marketing; sem rating (Conflito 4). |
| Trust signals / estatísticas | Nenhuma | "20+ YEARS" etc. em `docs/design/` são **exemplos**; não há claim verificado. Seção não deve ser renderizada com números. |
| Business info (telefone, endereço, horário) | Nenhuma | Nenhuma env/constante; CARSHOP-143 decidiu não exibir até existir fonte oficial. Final CTA sem esses dados. |
| Redes sociais | `serverEnv.social.*` (opcionais) | Já usadas só no Footer; fora do escopo da Home. |
| Hero image | Nenhuma dedicada | Única fonte de fotografia real são as imagens Cloudinary dos works (Conflito 2). |

Contrato backend confirmado em `carshop-backend/docs/api-contract.md`
(`GET /works`, `GET /works/{slug}`, `GET /works/{workId}/comments`). Não
existem endpoints de serviços, depoimentos, estatísticas ou informações de
negócio — **não inventar**.

## Conflitos / pontos em aberto (sinalizar ao usuário antes de prosseguir)

1. **"Refatorar a Home existente" vs. placeholder**: a Description fala em
   refatorar, mas a Home atual é placeholder. Não bloqueia; o trabalho é
   construção nova da composição. Registrado apenas para alinhar expectativa
   de esforço (5 pontos).
2. **Fonte da imagem do Hero**: DoD 1 + `imagery.md` exigem fotografia forte
   de interior; o repositório não tem asset. Opções:
   (a) usar a capa de um work real publicado (Cloudinary) — autêntico, mas
   depende da API e da qualidade/enquadramento da foto;
   (b) placeholder claramente identificado + requisito de mídia documentado
   (`imagery.md` → "Placeholder Strategy");
   (c) Hero tipográfico sem foto até existir mídia aprovada.
   Critério de seleção de work "destaque" também não existe no contrato
   (sem `featured`) — `architect` deve propor regra determinística (ex.:
   ordem da API + existência de capa) sem inventar campo. **Decisão do
   usuário/architect necessária.**
3. **Serviços**: usar os três serviços de `visual-direction.md`
   (Restoration, Custom Interiors, Repairs) e as descrições-exemplo de
   `components.md` como copy aprovada, ou tratá-los como exemplo e omitir a
   seção até existir conteúdo real? Os links "→" também não têm destino
   real (`/services` é placeholder). **Decisão do usuário necessária.**
4. **Testimonials**: comentários aprovados de works podem ser exibidos como
   depoimentos na Home? Isso reaproveita contrato existente, mas exigiria
   N chamadas (`GET /works/{id}/comments` por work) e muda a natureza do
   dado (comentário de projeto ≠ depoimento aprovado para marketing).
   Recomendação do spec: **omitir** testimonials e ratings nesta task.
   **Confirmação do usuário necessária.**
5. **CTAs do Hero e Final CTA**: "Get a Quote"/"Get a Free Quote" não tem
   destino (CARSHOP-143 decidiu CTA desabilitado). DoD 1 pede "CTA claro".
   Opções: CTA primário desabilitado idêntico ao header; CTA primário para
   `/contact` (existe, mas é placeholder); ou CTA primário "View Our Work"
   (`/portfolio`, destino real). **Decisão do usuário necessária.**
6. **Idioma da copy da Home**: navegação pública está em inglês (decisão da
   CARSHOP-143) e `docs/design/` usa copy em inglês, mas mensagens de
   estado da `/portfolio` (vazio/erro) estão em pt-BR e `category` dos works
   vem do backend em pt-BR (ex.: "bancos"). Recomendação: copy da Home em
   inglês, alinhada à CARSHOP-143, exibindo `category` como vem da API.
   **Confirmação do usuário.**
7. **Taglines de `visual-direction.md`** ("CUSTOM AUTOMOTIVE INTERIORS BUILT
   TO LAST.", "CRAFTED FOR YOUR CAR. BUILT FOR THE ROAD.", "READY TO
   TRANSFORM YOUR INTERIOR?", "Upholstery · Restoration · Custom Work"):
   são direção aprovada de marca, não claims factuais — o spec assume que
   podem ser usadas. "Built to last" pode ser lido como garantia; se o
   usuário discordar, ajustar.

## Escopo

Construir a Home pública (`app/(public)/page.tsx`) como Server Component
com composição editorial, reutilizando tokens/primitives existentes. Seções
candidatas (limites finais pelo `architect`, condicionados aos conflitos):

1. **Hero** — headline forte, linha de suporte, CTA primário/secundário
   (Conflito 5), fotografia conforme Conflito 2; `priority` apenas na imagem
   LCP, se houver.
2. **Craftsmanship/Services** — somente se Conflito 3 aprovar conteúdo;
   formato de lista editorial (não três cards arredondados com ícones).
3. **Our Work (featured projects)** — dados de `getWorks()`; composição
   dominante + apoio (não grid uniforme), imagem dominante, título,
   `category`, link para `/portfolio/[slug]` e "View all projects →" para
   `/portfolio`. Works sem capa: regra definida pelo `architect` (pular ou
   usar primeira imagem por `order`).
4. **Final CTA** — tipográfico/focado, sem business info (decisão
   CARSHOP-143) e sem conteúdo não relacionado.
5. **Estados degradados** — erro de API ou zero works publicados não quebram
   a Home: seção "Our Work" é omitida ou exibe estado vazio discreto; a
   página continua renderizando (Hero/CTA não dependem da API, salvo se
   Conflito 2 optar por (a), caso em que é preciso fallback).
6. Metadata da Home (title/description/canonical) coerente com as demais
   páginas públicas, sem claims inventados.
7. Ajuste pontual de `WorkImageThumb` ou novo wrapper de imagem pública
   para suportar proporções editoriais (16:9, 4:3, 3:4) sem quebrar os
   usos atuais (galeria e listagem) — decisão do `architect`.

Seções **não renderizadas** nesta task (sem dados reais): Before & After,
Why CarShop/Trust stats, Testimonials/ratings, Business Information —
salvo decisão diferente do usuário nos Conflitos 3/4. Componentes para elas
**não** devem ser criados "vazios" antecipadamente.

## Fora de escopo

- Alterar contratos/camada de dados (`lib/api/works.ts`, `comments.ts`),
  cache/ISR/tags ou criar endpoints/Route Handlers.
- Adicionar campos ao backend (`featured`, before/after, serviços,
  depoimentos) — registrar como dependência se o usuário quiser.
- Alterar Header/Footer/MobileNav (CARSHOP-143) ou habilitar destino do
  "Get a Quote".
- Construir as páginas `/services`, `/about`, `/contact` ou redesenhar
  `/portfolio` e Project Details.
- Inserir imagens de stock/IA apresentadas como trabalho real.
- Motion/parallax não justificados (Framer Motion só se o `architect`
  justificar, com `prefers-reduced-motion`).

## Critérios de aceite (derivados do DoD)

- Hero com hierarquia tipográfica forte (display Barlow Condensed), CTA
  claro conforme decisão do Conflito 5, sem informação de negócio inventada.
- Nenhuma seção de serviços no formato "três cards arredondados com ícones
  decorativos"; nenhum grid uniforme de cards como padrão da Home.
- "Our Work" usa works reais publicados com fotografia dominante e links
  funcionais para `/portfolio/[slug]` e `/portfolio`; nenhum campo inventado.
- Before/after, trust signals, testimonials, ratings e business info não
  aparecem sem dados reais aprovados.
- Final CTA e composição aderentes a `visual-direction.md`,
  `components.md` e `imagery.md` (radius restrito, sem gradientes/glass/
  sombras genéricas, sem overlays pesados, alt text significativo via
  `image.alt || title`).
- `next/image` com `sizes` corretos por breakpoint, espaço reservado
  (aspect-ratio/contêiner estável, sem CLS) e `priority` somente na imagem
  crítica acima da dobra.
- Falha de `GET /works` ou lista vazia não quebra a Home (sem erro 500),
  com comportamento testado.
- Mobile/tablet/desktop verificados na app rodando (dev server), ordem de
  leitura coerente no mobile, CTAs visíveis, touch targets adequados.
- Acessibilidade: um único `h1`, hierarquia de headings, landmarks/
  `aria-labelledby` por seção, foco visível, contraste WCAG.
- `lint`, `typecheck`, `build` e testes relevantes passam; `page.test.tsx`
  reescrito para a nova Home (mock de `getWorks`: sucesso, vazio, erro);
  cobertura ≥ 80% no código novo/alterado.

## Riscos

- Home passa a depender de `GET /works` (ISR 1h): garantir fallback e não
  bloquear build caso a API esteja indisponível.
- Fotos reais dos works podem ter enquadramento/qualidade inadequados para
  hero/destaque; crop cego (`object-center`) pode cortar a costura/detalhe.
- Alterar `WorkImageThumb` afeta galeria e listagem do portfolio — preferir
  mudança aditiva e rodar os testes desses componentes.
- Testar Server Component assíncrono exige padrão de teste diferente do
  placeholder atual (await do componente + mock de `server-only`/`getWorks`).

## Classificação de tamanho

**NON-TRIVIAL** — construção de uma página inteira com múltiplas seções e
novos componentes públicos, integração com dados reais (`getWorks`) e
estados degradados, possível ajuste em componente compartilhado
(`WorkImageThumb`), e decisões de arquitetura/UI (composição, boundaries,
estratégia de imagem/LCP, responsividade) que cabem ao `architect`. Há
conflitos de conteúdo que exigem decisão do usuário. Plano persistido
obrigatório.

## Próximos agentes

- `knowledge-reader`: recomendado — notas de CARSHOP-142/143/34/35 no
  Obsidian (tokens, decisões do shell público, padrões de imagem/galeria,
  testes de Server Components async).
- `architect`: obrigatório — composição final da Home a partir do conteúdo
  realmente disponível, regra de seleção de works em destaque, estratégia de
  imagem (Hero/LCP, proporções, `sizes`, object-position), boundaries de
  componentes, Server vs Client, fallback de erro/vazio — após as decisões
  do usuário nos Conflitos 2–6.
- `plan-writer`: obrigatório — faseamento sugerido: (1) componente/ajuste de
  imagem editorial, (2) Hero + Final CTA, (3) Our Work com dados reais e
  estados degradados, (4) seção de serviços se aprovada, (5) metadata,
  testes, validação responsiva no dev server.
