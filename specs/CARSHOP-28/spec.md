# CARSHOP-28 — Criar página /admin/login (UI + validação)

## Referência da tarefa

- Notion: `CARSHOP-28` — "Criar página /admin/login (UI + validação)".
- Contexto consultado: Status Done, Priority Medium, Sprint 5, Stack
  Frontend, Component Auth, Epic Frontend Admin, Type Task.
- A tarefa exige formulário de e-mail/senha no App Router, validação,
  integração com o login real, estados de loading/erro/sucesso e proteção
  contra enumeração de contas.

## Estado encontrado e lacuna confirmada

A rota `/admin/login`, seu formulário e a integração de autenticação já
existiam no repositório como parte da entrega mais ampla da `CARSHOP-122`.
Por isso, esta branch não reimplementa a página. A inspeção do comportamento
existente confirmou uma lacuna específica no estado de sucesso: após
`login()` a página redirecionava diretamente para `/admin`, sem feedback
explícito ao usuário.

O escopo funcional desta alteração é:

1. Exibir o toast de sucesso `Admin logado` após `login()` resolver e antes
   de redirecionar para `/admin`.
2. Não exibir o toast nem redirecionar quando `login()` rejeitar.
3. Exibir uma mensagem fixa para qualquer falha de login, sem repassar o
   `message` retornado pelo backend. O texto adotado é
   `E-mail ou senha inválidos.`, independentemente de a resposta original
   mencionar e-mail inexistente, senha incorreta ou outro detalhe.

O terceiro item fecha uma lacuna de segurança identificada durante o review:
`getApiErrorMessage()` é adequado para erros genéricos da aplicação, mas
repassa `body.message` e, portanto, não garante por si só que o fluxo de
autenticação impeça enumeração de contas.

## Comportamento esperado

### Validação e envio

- O formulário continua usando React Hook Form, Zod e o schema existente.
- Campos obrigatórios e formato de e-mail continuam validados antes da
  chamada a `login()`.
- Durante o envio, o botão permanece desabilitado e exibe `Entrando...`.

### Sucesso

- `login()` recebe o e-mail e a senha validados.
- O toast `Admin logado` é exibido após a autenticação ser confirmada.
- A navegação para `/admin` ocorre em seguida.

### Erro

- A página permanece no formulário e não redireciona.
- Nenhum toast de sucesso é exibido.
- O alerta mostra apenas `E-mail ou senha inválidos.`.
- Mensagens específicas recebidas do backend não são renderizadas.

## Locais da implementação

- `app/(admin)/admin/login/page.tsx`: feedback de sucesso, redirecionamento
  e normalização local da mensagem de falha de autenticação.
- `app/(admin)/admin/login/page.test.tsx`: cobertura do toast no sucesso,
  ausência do toast no erro e invariância da mensagem exibida diante de
  causas distintas, sem casts inseguros em fixtures.

Não há alteração no contrato HTTP: `lib/api/auth.client.ts` continua
responsável por `POST /auth/login`, e o `AuthProvider` continua responsável
por manter o estado autenticado após a resposta bem-sucedida.

## Definition of Done desta alteração

- [x] Login bem-sucedido exibe `Admin logado` e redireciona para `/admin`.
- [x] Login malsucedido não exibe toast de sucesso nem redireciona.
- [x] Falhas de autenticação sempre exibem `E-mail ou senha inválidos.`.
- [x] Mensagens distintas do backend não permitem inferir se a conta existe.
- [x] Testes do formulário, lint e typecheck passam sem casts inseguros novos.

## Validação executada

- `npm test -- 'app/(admin)/admin/login/page.test.tsx'`: 5 testes passaram.
- `npm run test:coverage -- 'app/(admin)/admin/login/page.test.tsx'`: página
  de login com 94,11% de statements e linhas e 100% de branches.
- `npm test`: 50 arquivos e 246 testes passaram.
- `npm run lint`: passou sem erros.
- `npm run typecheck`: passou sem erros.
- `npm run build`: build de produção concluído com sucesso.

## Fora de escopo

- Reimplementar a rota ou o formulário de login.
- Alterar payload, endpoint ou resposta do contrato de autenticação.
- Alterar `AuthProvider`, refresh, logout ou proteção das rotas admin.
- Alterar o status da tarefa no Notion.

## Riscos e dependências

- A normalização intencionalmente prioriza a não enumeração de contas; o
  detalhe técnico de falhas de rede ou indisponibilidade do backend não é
  exposto nessa tela.
- `sonner`, React Hook Form e Zod já estão instalados e em uso no projeto.

## Classificação de tamanho: SMALL

É uma alteração focada em uma página e sua suíte de testes, além do
alinhamento da especificação. Não exige decisão arquitetural nem plano
persistido.

## Próximos agentes necessários

- `knowledge-reader`: não necessário.
- `architect`: não necessário; não há mudança estrutural.
- `plan-writer`: não necessário para uma tarefa SMALL e localizada.
- `developer`: implementa os ajustes descritos.
- `tester`: valida os critérios acima e as regressões do fluxo de login.
- `reviewer`: confere segurança, tipagem, testes e aderência a esta spec.

## Segurança da especificação

Esta especificação não contém segredos, tokens, senhas, valores de `.env`
nem dados pessoais de clientes.
