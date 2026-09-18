# CARSHOP-27 — Remover duplicação nos testes do formulário de comentário

## Referência da tarefa

- Notion: `CARSHOP-27` — "Criar formulário de comentário"
- Página: <https://app.notion.com/p/2de765c3f0d4809b8250edece9ced3cd>
- Estado consultado: `Review`, Sprint 4, Priority Medium, Stack Frontend e
  Component não preenchido.
- O DoD original exige o envio do comentário e a informação de que ele aguarda
  aprovação. O risco registrado exige impedir HTML ou scripts.

## Contexto desta atualização

A funcionalidade da `CARSHOP-27` já está implementada na branch
`feat/CARSHOP-27`. O formulário valida nome e comentário, envia o payload para
a API, informa o sucesso pendente de aprovação e cobre os fluxos de erro.

O pedido atual é um ajuste de qualidade no novo código de teste. O SonarCloud
aponta em `app/(public)/portfolio/[slug]/comment-form.test.tsx`:

- `68.6%` de linhas duplicadas no novo código;
- `35` linhas duplicadas no novo código.

A inspeção do arquivo confirma repetição estrutural nos três testes que rejeitam
HTML/scripts: criação do usuário, renderização do formulário, preenchimento dos
dois campos, submissão e as mesmas asserções de validação e ausência de chamada
à API.

## Objetivo

Reduzir a duplicação reportada pelo SonarCloud por meio de refactor apenas da
suíte de `CommentForm`, preservando integralmente a cobertura e o comportamento
verificado.

## Escopo

- Consolidar o setup e as interações repetidas dos cenários de rejeição de
  HTML/scripts no arquivo
  `app/(public)/portfolio/[slug]/comment-form.test.tsx`.
- Representar as variações relevantes de campo e conteúdo malicioso sem repetir
  o corpo completo do teste.
- Manter explícito, para cada variação, qual campo recebe o valor inválido e
  qual conteúdo é exercitado.
- Preservar os demais cenários existentes no arquivo.

## Critérios de aceitação

1. Os três comportamentos de segurança continuam cobertos:
   - tag `<script>` no campo Comentário;
   - HTML com manipulador de evento no campo Nome;
   - HTML embutido no meio de texto legítimo no campo Comentário.
2. Cada entrada inválida continua exibindo
   `Não é permitido incluir HTML ou scripts.`.
3. `createComment` continua não sendo chamado em todos os cenários inválidos.
4. Permanecem cobertos e inalterados os cenários de formulário vazio, envio com
   sucesso, erro estruturado da API e erro genérico.
5. Nenhum teste é removido, enfraquecido ou substituído por uma asserção menos
   específica apenas para reduzir a métrica.
6. O refactor não altera `comment-form.tsx`, o contrato da API nem o
   comportamento de produção.
7. O arquivo permanece em TypeScript estrito, sem `any`, `@ts-ignore`,
   `@ts-expect-error` ou cast inseguro.
8. A suíte direcionada do `CommentForm`, lint e typecheck passam.
9. O bloco repetido responsável pelas 35 linhas duplicadas deixa de existir e a
   análise subsequente do SonarCloud não volta a apontar essa duplicação no novo
   código do arquivo.

## Fora de escopo

- Alterar as regras de validação contra HTML/scripts.
- Mudar textos, layout ou acessibilidade do formulário.
- Alterar serviços, payloads, rotas ou tratamento de erros da API.
- Adicionar dependências.
- Refatorar outras suítes de teste ou tratar issues Sonar fora do arquivo alvo.

## Estado do repositório e dependências

- Arquivo alvo: `app/(public)/portfolio/[slug]/comment-form.test.tsx`.
- Implementação exercitada: `app/(public)/portfolio/[slug]/comment-form.tsx`.
- Stack de testes confirmada em `package.json`: Vitest, Testing Library e
  `@testing-library/user-event`.
- Não há bloqueio externo nem necessidade de nova dependência.
- Não há conflito entre este ajuste e a Description/DoD da tarefa no Notion;
  trata-se de um refinamento de qualidade dos testes da implementação existente.

## Verificação esperada

- Executar o teste direcionado de `comment-form.test.tsx`.
- Executar `npm run lint`.
- Executar `npm run typecheck`.
- Confirmar na análise do PR que a duplicação indicada pelo SonarCloud foi
  resolvida.

## Classificação de tamanho: TRIVIAL

Mudança específica, localizada em um único arquivo de teste, sem alteração de
produção, dependência, contrato ou arquitetura. O refactor é de baixo risco e
tem critérios objetivos de preservação de comportamento.

## Próximos agentes

- `knowledge-reader`: não necessário; não há decisão histórica ou conhecimento
  externo necessário para o refactor localizado.
- `architect`: não necessário; nenhuma decisão estrutural ou arquitetural está
  envolvida.
- `plan-writer`: não necessário para uma tarefa `TRIVIAL`.
- `developer`: necessário para aplicar o refactor no teste.
- `tester`: necessário para executar as verificações e confirmar a preservação
  da cobertura e a resolução do apontamento.

## Segurança da especificação

Esta especificação não contém segredos, tokens, senhas, valores de ambiente nem
dados pessoais de clientes.
