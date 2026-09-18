# CARSHOP-26 — Listar comentários aprovados no frontend

## Referência

Notion Task Tracker: CARSHOP-26 (Epic: Frontend Público, Sprint 4, Priority:
Medium, Stack: Frontend, Component: não preenchido, Status: Backlog). Ver
descrição completa, DoD e notas técnicas na task original — não duplicadas
aqui.

## Contrato de API — verificação (bloqueio da Description resolvido)

A Description do Notion cita `GET /works/:id/comments` como contrato a
implementar. Conferindo o repositório atual, esse endpoint **já está
implementado e consumido** no frontend:

- `lib/api/comments.ts` — `getWorkComments(workId)`, `fetch` nativo (Server
  Component, ADR-001), chama `GET {apiUrl}/works/:workId/comments`. O
  comentário no código confirma: "lista apenas comentários aprovados —
  filtro aplicado pelo backend".
- Tipo `Comment` já definido: `{ id, workId, authorName, content, status,
  createdAt, updatedAt }`, com `CommentStatus = "PENDING" | "APPROVED"`.
- `app/(public)/portfolio/[slug]/page.tsx` (Server Component) já chama
  `getWorkComments(work.id)` e renderiza a lista.

**Conclusão**: a dependência "Endpoint de comentários criado", citada na
task, já está satisfeita — não é um bloqueio real. O contrato usado no
código bate com o que a Description do Notion descreve.

## Contexto no repositório (estado atual) — achado importante

Ao investigar, constatou-se que **a maior parte do escopo desta task já foi
implementada** em `app/(public)/portfolio/[slug]/page.tsx`:

- Busca comentários aprovados via `getWorkComments` (com tratamento de erro
  e mensagem via `ErrorToast`).
- Renderiza `authorName` e `content` como texto puro, dentro de `<p>{...}</p>`
  (JSX escapa automaticamente — não há `dangerouslySetInnerHTML` em nenhum
  ponto do código atual, o que já atende ao risco "nunca renderizar HTML").
- Trata o estado vazio ("Ainda não há comentários aprovados para este
  projeto.").

**Lacuna identificada em relação ao DoD/Description**: a Description pede
explicitamente exibir "nome, mensagem **e data**", mas a implementação atual
(linhas 96-104 de `page.tsx`) só renderiza `comment.authorName` e
`comment.content` — a `createdAt` do comentário não é exibida em nenhum
lugar. Não há utilitário de formatação de data no repositório
(`Intl.DateTimeFormat`/`toLocaleDateString` não são usados em lugar algum
hoje), então será necessário formatar a data diretamente na página, sem
adicionar dependência nova.

Este é o único gap real de escopo desta task frente ao estado atual do
repositório.

## Escopo

- Exibir a data (`comment.createdAt`) de cada comentário aprovado na lista
  já existente em `app/(public)/portfolio/[slug]/page.tsx`, junto de
  `authorName` e `content`.
- Formatar a data de forma legível (ex.: `Intl.DateTimeFormat('pt-BR', ...)`
  ou equivalente simples, sem nova dependência), mantendo renderização como
  texto puro (JSX, sem `dangerouslySetInnerHTML`).
- Atualizar/estender os testes existentes de
  `app/(public)/portfolio/[slug]/page.test.tsx` para cobrir a exibição da
  data.
- Confirmar (via teste ou revisão) que o texto de comentário nunca é
  renderizado como HTML, mesmo se o `content` contiver marcação (ex.:
  `<script>`), reforçando o risco citado na Description.

## Fora de escopo

- Qualquer alteração no backend Express ou no contrato de
  `GET /works/:id/comments` (já implementado e funcional).
- Moderação/aprovação de comentários (admin) — já coberto por
  `app/(admin)/admin/(protected)/comment-moderation-form.tsx` (fora desta
  task).
- Criação de novos comentários — já coberta por `comment-form.tsx` (fora
  desta task).
- Paginação, ordenação customizada ou filtros adicionais de comentários (não
  citados na Description/DoD).
- Criação de um utilitário de formatação de data compartilhado/reutilizável
  em outras partes do app — se o `architect`/`knowledge-reader` identificar
  necessidade de reuso amplo, isso deve ser tratado como decisão à parte, não
  assumida aqui.

## Critérios de aceite (DoD: "Comentários aprovados aparecem corretamente")

1. A página `/portfolio/[slug]` exibe, para cada comentário aprovado,
   `authorName`, `content` e uma data formatada derivada de `createdAt`.
2. Apenas comentários com `status: "APPROVED"` aparecem (filtro já garantido
   pelo backend; frontend não deve reintroduzir comentários `PENDING`).
3. Nenhum comentário é renderizado via `dangerouslySetInnerHTML` ou
   equivalente — texto de `authorName`/`content` sempre tratado como texto
   puro, mesmo contendo marcação HTML.
4. Estado vazio (nenhum comentário aprovado) continua exibindo a mensagem
   already existente, sem quebra.
5. Estado de erro na busca de comentários continua exibindo `ErrorToast`,
   sem quebra.
6. Testes de `page.test.tsx` cobrem a renderização da data.

## Riscos

- **XSS/sanitização** (citado explicitamente na Description como "nunca
  renderizar HTML"): mitigado hoje por convenção (JSX escapa strings por
  padrão); não há regra formal em `docs/rules/security.md` sobre isso —
  reportado como observação, não como bloqueio, já que o comportamento atual
  já é seguro.
- Formatação de data pode divergir de timezone/locale se não for definida
  explicitamente (`pt-BR` vs. locale do navegador) — decisão pequena, não
  arquitetural.

## Dependências / bloqueios

- Nenhum bloqueio real identificado. O endpoint necessário já existe e já é
  consumido pelo frontend.

## Classificação de tamanho: SMALL

Justificativa: a mudança é pontual e concentrada em um único
arquivo-alvo (`app/(public)/portfolio/[slug]/page.tsx`) e seu teste
correspondente — apenas adicionar exibição de data a uma lista já
implementada. Não há decisão arquitetural nova (Server/Client Component já
decidido e correto), não há novo contrato de API, e não há múltiplas
áreas do código envolvidas. Plano (`plan.md`) é opcional.

## Próximos agentes necessários

- `knowledge-reader`: opcional — pode valer consultar Obsidian por qualquer
  decisão prévia sobre formatação de data/locale no projeto, para evitar
  inconsistência com outras telas que venham a exibir datas no futuro.
- `architect`: não necessário — não há decisão estrutural/visual em aberto;
  a mudança é aditiva a um componente já existente e segue o padrão já
  estabelecido na página.
- `plan-writer`: não obrigatório (task SMALL). Pode ser acionado a critério
  do usuário se preferir registrar um plano mesmo assim.
