# CARSHOP-27 — Criar formulário de comentário

## Referência

Task no Notion: CARSHOP-27 ("Criar formulário de comentário"), Backlog,
Epic Frontend Público, Sprint 4, Priority Medium. Ver Description/DoD/
Technical Notes originais no Notion — não duplicados aqui.

## Estado real do repositório (descoberta antes de planejar)

Ao investigar o código antes de escrever esta spec, foi confirmado que a
funcionalidade descrita na task **já está implementada** na branch atual
(`feat/CARSHOP-27`), presumivelmente em um commit anterior desta mesma
branch:

- `app/(public)/portfolio/[slug]/comment-form.tsx` — Client Component com
  formulário (nome + comentário), `react-hook-form` + `zodResolver`,
  chamada a `createComment`, mensagem de sucesso ("Comentário enviado! Ele
  será exibido após aprovação.") e tratamento de erro via
  `getApiErrorMessage`.
- `lib/api/comments.client.ts` — `createComment(workId, payload)` faz
  `POST /works/:workId/comments` via `http` (Axios), payload
  `{ authorName, content }`, retorna `Comment` com `status: "PENDING"`.
- `lib/api/comments.ts` — `getWorkComments(workId)` faz
  `GET /works/:workId/comments` (Server Component, `fetch` nativo, ISR),
  retorna apenas comentários aprovados (filtro do backend).
- `app/(public)/portfolio/[slug]/page.tsx` — página de detalhes do
  projeto já integra `<CommentForm workId={work.id} />` na seção de
  comentários, junto com a listagem de comentários aprovados (trabalho
  do commit `85b9683`, CARSHOP-26).
- `app/(public)/portfolio/[slug]/comment-form.test.tsx` — cobre validação
  vazia, submit com sucesso (mensagem de aguardando aprovação), erro com
  mensagem estruturada da API e erro genérico.

### Contrato de API confirmado

Confirmado pelo código-fonte real (`lib/api/comments.client.ts` e
`lib/api/comments.ts`), não apenas pela Description do Notion:

- `POST /works/:workId/comments` — público, sem autenticação. Body:
  `{ authorName: string; content: string }`. Resposta: `Comment` com
  `status: "PENDING"`.
- `GET /works/:workId/comments` — público, retorna apenas comentários
  `APPROVED` (filtro no backend).

Não há Swagger/OpenAPI nem `docs/api-contract.md` no repositório; o
contrato foi confirmado via o client Axios/fetch já implementado e usado
em produção pelo código atual, que é a fonte de verdade mais alta
disponível (acima da Description do Notion, conforme hierarquia de fontes
do `CLAUDE.md`). Não há conflito entre o endpoint citado no Notion e o
contrato real — ambos coincidem.

## Gap identificado frente ao DoD/Riscos do Notion

O DoD ("Comentário enviado e usuário informado que aguarda aprovação") e
a exibição para API já estão atendidos. Porém, o item de **Riscos /
Atenção** do Notion — "Não permitir HTML ou scripts (sanitização/
validação obrigatória no frontend)" — **não está coberto**:

- O schema Zod atual (`commentSchema` em `comment-form.tsx`) só valida
  `min(1)` para `authorName` e `content`; não há sanitização nem rejeição
  de conteúdo HTML/script.
- Não há nenhuma biblioteca de sanitização (`dompurify`, `sanitize-html`,
  `xss` etc.) instalada em `package.json`.
- Isso é uma lacuna real de risco de segurança (XSS refletido, caso o
  conteúdo de comentários seja renderizado sem escaping em algum ponto —
  hoje o `page.tsx` usa JSX puro, que escapa por padrão, mas o requisito
  de negócio pede validação explícita no frontend independentemente
  disso).

## Escopo desta task (o que falta)

1. Adicionar validação/sanitização explícita no frontend para impedir
   HTML/scripts no campo `content` (e possivelmente `authorName`) do
   formulário de comentário, alinhado ao risco listado no Notion.
   - Abordagem recomendada a decidir pelo `architect`/`developer`: reforço
     no schema Zod (ex.: `refine`/regex rejeitando `<`, `>`, tags HTML)
     e/ou normalização do valor antes do envio. Adicionar biblioteca de
     sanitização é uma decisão de dependência nova — deve ser tratada
     como tal (confirmar necessidade, não assumir instalação).
   - Testar tanto o caminho feliz quanto tentativa de injeção
     (`<script>`, `<img onerror=...>` etc.) em
     `comment-form.test.tsx`.
2. Validar se o restante do fluxo (form, integração na página, sucesso,
   erro) já atende integralmente ao DoD — não deve ser reimplementado,
   apenas confirmado pelo `developer`/`tester`.

## Fora de escopo

- Moderação/aprovação de comentários (admin) — já coberta por
  `comment-moderation-form.tsx` (fora desta task).
- Alterações no backend/contrato de API.
- Redesenho visual do formulário (task não menciona Figma específico;
  estilo atual usa Tailwind + `Button` já existente, dentro dos padrões
  do design system).

## Componentes/arquivos afetados

- `app/(public)/portfolio/[slug]/comment-form.tsx` (schema/validação)
- `app/(public)/portfolio/[slug]/comment-form.test.tsx` (novos casos de
  teste para tentativa de HTML/script)
- Possível novo arquivo de utilitário de sanitização, se o
  `architect`/`developer` decidir extrair a lógica.
- `package.json`, somente se uma dependência de sanitização for
  formalmente aprovada como necessária (não assumir isso agora).

## Dependências / bloqueios

- Nenhum bloqueio de backend: o endpoint já existe e está integrado.
- Decisão em aberto para o `architect`: sanitização via regex/Zod puro
  (sem nova dependência) vs. adicionar biblioteca dedicada — deve ser
  registrada como decisão arquitetural leve antes da implementação.

## Classificação de tamanho: SMALL

Justificativa: o formulário, a integração com a API e a página de
detalhes já existem e funcionam; o trabalho restante é um reforço de
validação/sanitização concentrado essencialmente em um arquivo
(`comment-form.tsx`) e seus testes, sem mudança de arquitetura, rota ou
contrato de API. Não há decisão arquitetural de grande porte — apenas
uma escolha pequena (regex/Zod vs. biblioteca) que pode ser resolvida
pelo `architect` de forma leve, sem exigir `plan.md` obrigatório.

## Próximos agentes necessários

- `knowledge-reader`: opcional — pode valer a pena checar se há notas no
  Obsidian sobre padrões de sanitização/XSS já adotados em outra task do
  projeto (ex.: outros formulários públicos), para manter consistência.
- `architect`: recomendado, mas leve — apenas para decidir a abordagem de
  sanitização (regra própria vs. nova dependência) antes do `developer`
  implementar. Não é abertura de arquitetura ampla.
- `plan-writer`: não obrigatório (task é SMALL). Pode ser pulado a menos
  que o `architect` identifique complexidade adicional ao investigar.
- `developer`: implementa o reforço de validação/sanitização e confirma
  que o restante do fluxo já implementado atende ao DoD.
- `tester`: garante cobertura para os novos casos (tentativa de
  HTML/script) e mantém os testes existentes passando.
