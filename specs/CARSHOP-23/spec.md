# CARSHOP-23 — Redirect /trabalhos -> /portfolio

## Referência

Tarefa original no Notion: CARSHOP-23 ("Criar página de listagem de trabalhos").
Ver descrição, DoD e Technical Notes completos na tarefa.

## Conflito de escopo identificado e decisão aprovada

O escopo original do Notion pedia a criação de uma página `/trabalhos` que
buscasse trabalhos via `GET /works` e exibisse cards com título, imagem de
capa e informações públicas, tratando loading/erro/estado vazio.

As Technical Notes do próprio Notion já alertavam para risco de sobreposição
com a CARSHOP-116. Essa investigação foi confirmada nesta sessão: o arquivo
`app/(public)/portfolio/page.tsx` já implementa integralmente essa
experiência — busca via `getWorks()` (`lib/api/works`), exibição de cards com
título e imagem de capa (`WorkImageThumb`), e tratamento de erro (via
`ErrorToast`) e de estado vazio ("Nenhum projeto publicado ainda.").

**Decisão do usuário (já aprovada, não é mais uma questão em aberto):** em
vez de duplicar a experiência pública, o escopo real da CARSHOP-23 passa a
ser criar um redirect da rota `/trabalhos` para `/portfolio`, funcionando
como uma URL amigável em pt-BR, sem duplicar a página existente.

Este spec documenta esse escopo já ajustado.

## Escopo ajustado

Implementar um redirecionamento de `/trabalhos` para `/portfolio` no Next.js
App Router, de forma que:

- Qualquer acesso a `/trabalhos` resulte em redirecionamento para
  `/portfolio`, preservando o comportamento correto para SEO (redirect
  permanente/308 ou 301, conforme suportado pelo mecanismo escolhido).
- Não seja criada nenhuma página duplicada ou lógica de busca de dados em
  `/trabalhos` — a página `/portfolio` (CARSHOP-116) continua sendo a única
  fonte da experiência pública de listagem de trabalhos.

### Opções técnicas possíveis (decisão de implementação, não arquitetural)

O repositório não possui `middleware.ts` nem `redirects()` configurado em
`next.config.mjs`. Duas abordagens nativas do Next.js App Router atendem ao
requisito, ambas de baixo risco:

1. Adicionar uma função `redirects()` em `next.config.mjs` mapeando
   `/trabalhos` para `/portfolio` (`permanent: true`) — redirect resolvido
   no nível de roteamento/build, recomendado para casos simples como este.
2. Criar `app/(public)/trabalhos/page.tsx` chamando `redirect('/portfolio')`
   de `next/navigation`.

A escolha entre as duas fica a critério do `developer` na implementação,
respeitando `docs/rules/rendering.md` e `docs/rules/routing.md` quando
aplicável. Nenhuma decisão arquitetural adicional é necessária dado o baixo
risco e escopo restrito da mudança.

## DoD ajustado

- Acessar `/trabalhos` redireciona corretamente para `/portfolio`.
- O redirecionamento é compatível com SEO (não resulta em conteúdo
  duplicado indexável; usa redirect permanente quando aplicável).
- Nenhuma nova busca de dados, cards ou lógica de loading/erro/estado vazio
  é duplicada em `/trabalhos` — a página `/portfolio` continua sendo a
  única responsável por essa experiência.
- Não há alteração de comportamento em `/portfolio` (CARSHOP-116
  permanece intacta).

## Fora de escopo

- Qualquer alteração na página `/portfolio` ou em `lib/api/works`.
- Qualquer nova busca de dados de trabalhos.
- Decisões de arquitetura de renderização além do redirect em si.

## Classificação de tamanho

**TRIVIAL** — mudança específica, de baixo risco, restrita a 1 arquivo
(`next.config.mjs` ou uma nova `page.tsx` de redirect em
`app/(public)/trabalhos/`). Não há necessidade de plano (`plan-writer`).

## Próximos agentes necessários

- `knowledge-reader`: opcional. Pode ser consultado rapidamente para
  verificar se há alguma nota histórica no Obsidian sobre a sobreposição
  CARSHOP-23/CARSHOP-116, mas não é bloqueante dado que o escopo já foi
  decidido pelo usuário.
- `architect`: não necessário. Não há decisão arquitetural em aberto; as
  duas opções técnicas listadas são equivalentes em termos de estrutura,
  Server/Client Components e limites de componente.
- `plan-writer`: não necessário (tarefa TRIVIAL).

Pode seguir diretamente para `developer` com este spec.
