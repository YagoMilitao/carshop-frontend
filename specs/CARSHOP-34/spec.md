# CARSHOP-34 — Listar imagens existentes e permitir remoção

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Admin
- **Component**: Images
- **Sprint**: Sprint 6
- **Priority**: Medium
- **Points**: 3
- **Figma**: não há

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-34` no Notion.
Aqui ficam só os pontos necessários para orientar o trabalho.

## Decisões confirmadas pelo usuário

- **Integração: Opção A.** A funcionalidade fica na seção de imagens do
  `WorkListItem`, na listagem `/admin/trabalhos`, onde o upload da
  CARSHOP-33 já está. A tela de edição (`trabalhos/[slug]/editar`) não é
  alterada.
- **Fonte de dados: `getAdminWorks()`** (`GET /works?includeDrafts=true`,
  autenticado). Ver a divergência 1.
- **Classificação: SMALL**, sem `plan.md`.

## Divergências registradas

1. **Description do Notion x fonte de dados adotada.** A Description manda
   usar `images[]` de `GET /works/{slug}`. Esse endpoint **existe** no
   `docs/api-contract.md` do `carshop-backend`, mas é público e retorna 404
   para rascunhos, então não serve para o admin. A fonte adotada é
   `getAdminWorks()` (`lib/api/works.client.ts`, query key
   `adminWorksQueryKey`). Ela retorna `WorkResponse[]` com `id` e
   `images[].id`, inclui rascunhos e já é usada por `WorkListItem` e
   `EditWorkForm`.
2. **Débito técnico (fora do escopo).** O comentário de `getWorkBySlug` em
   `lib/api/works.ts` (por volta da linha 87) diz que "não há
   `GET /works/:slug` público", o que está desatualizado segundo o
   `api-contract.md`. O mesmo vale para os textos das specs CARSHOP-32 e
   CARSHOP-116. **Não alterar `lib/api/works.ts` nesta task.** Fica só o
   registro, para uma task futura.
3. **Autenticação: "Authorization Bearer" (Notion) vs. cookies + CSRF
   (ADR-016/018).** Na prática não há conflito: são mecanismos
   complementares. O client real (`lib/api/http.ts`) faz o seguinte:
   - envia `withCredentials: true` via o proxy same-origin `/api-proxy`;
   - injeta `Authorization: Bearer <accessToken>` (o token fica só em
     memória);
   - injeta `X-CSRF-Token` a partir do cookie `csrf_token` em POST, PUT,
     PATCH e DELETE;
   - em 401, tenta `POST /auth/refresh` uma única vez e, se falhar, chama
     `onAuthFailure`, que leva ao redirecionamento para o login.

   `deleteWorkImage` já usa esse client. **Não se adiciona nenhum header
   manual.** Esse é o mesmo padrão do upload da CARSHOP-33.

## Contrato confirmado (`docs/api-contract.md` do `carshop-backend`)

`DELETE /admin/works/{workId}/images/{imageId}` (admin, autenticado)

- `workId` = `work.id`; `imageId` = `WorkImage.id`
- **Sucesso**: `200` com corpo `{ "success": true }`. O `deleteWorkImage`
  atual (`Promise<void>`, ignora o corpo) é compatível. A UI se atualiza
  pelo refetch, sem depender do corpo.
- **Erros**:
  - `401`: sessão expirada;
  - `404`: trabalho ou imagem não encontrado;
  - `429`: rate limit;
  - `500`: erro interno.

## Estado real do repositório

- **Tipos** (`lib/api/works.ts`): `Work.id` e
  `WorkImage { id, url, publicId, alt, isCover, order, createdAt, updatedAt }`.
- **Camada de dados já pronta**: `deleteWorkImage(workId, imageId)` em
  `lib/api/images.client.ts`, testada.
- **Remoção já existe parcialmente e fora do DoD**, em
  `app/(admin)/admin/(protected)/trabalhos/work-list-item.tsx`:
  - lista `work.images` apenas como texto (`image.alt || image.id`), **sem
    miniatura e sem grid**;
  - botão "Remover imagem" que chama `deleteWorkImage` **sem confirmação**;
  - após sucesso: `invalidateQueries(adminWorksQueryKey)`,
    `revalidateWorksTag()` e `router.refresh()`;
  - erro e pendência são estados compartilhados com o upload
    (`runMutation`, `isPending`, `error`).
- **Upload (CARSHOP-33)**: o `WorkImageUpload`
  (`trabalhos/_components/work-image-upload.tsx`) é renderizado no mesmo
  `WorkListItem`.
- **Padrão de confirmação**: `DeleteWorkDialog`
  (`trabalhos/_components/delete-work-dialog.tsx`, Shadcn `AlertDialog`,
  componente de apresentação com `open`, `onConfirm`, `isPending` e
  `error`).
- **Miniaturas**: `next.config.mjs` já libera `res.cloudinary.com` em
  `images.remotePatterns`.
- **Erros**: `getApiErrorMessage` (`lib/api/auth.client.ts`) usa
  `body.message` do backend ou uma mensagem genérica. Não diferencia status.

## Objetivo

Permitir ao admin ver as imagens reais de cada work em grid (com
miniatura) no `WorkListItem` e remover uma imagem com confirmação
explícita. A UI deve ser atualizada após o sucesso e dar feedback adequado
em caso de erro.

## Escopo

1. **Grid de imagens existentes** a partir de `work.images`, com miniatura
   via `next/image` e `url`, `alt` significativo (usar `image.alt` e um
   fallback descritivo quando vazio), e indicação de capa (`isCover`) se
   couber na UI. A ordenação por `order` é decisão do `architect`. Deve
   haver um estado vazio claro quando não houver imagens.
2. **Confirmação antes de excluir**: diálogo `AlertDialog` no padrão de
   `DeleteWorkDialog`, com o botão de confirmar desabilitado e o texto
   "Excluindo..." durante o DELETE. Pode ser um componente novo (ex.
   `DeleteWorkImageDialog`) ou uma generalização do existente; essa escolha
   é do `architect`.
3. **Remoção**: `deleteWorkImage(work.id, image.id)` via o `http` client
   existente, com Bearer e CSRF automáticos.
4. **Atualização após sucesso (200)**: manter o fluxo atual (invalidar
   `adminWorksQueryKey`, `revalidateWorksTag()`, `router.refresh()`) e
   fechar o diálogo. A imagem some depois do refetch.
5. **Feedback de erro** (acessível, `role="alert"`, diálogo aberto para
   nova tentativa quando fizer sentido):
   - `401`: o interceptor já tenta o refresh e redireciona ao login se ele
     falhar. Se o erro chegar ao componente, mostrar uma mensagem de sessão
     expirada.
   - `404`: mensagem de trabalho ou imagem não encontrado. Recomenda-se
     fazer refetch também, para tirar da tela uma imagem que já não
     existe. Isso é decisão do `architect`.
   - `429`: mensagem de muitas tentativas, pedindo para aguardar e tentar
     de novo.
   - `500`: mensagem genérica de erro.

   Se `getApiErrorMessage` não bastar para diferenciar os status, criar um
   mapeamento por status local à feature, sem mudar o comportamento global.
6. **Separar o estado de pendência e erro da remoção** do estado
   compartilhado com o upload (`runMutation`), para que o erro de uma ação
   não apareça como erro da outra.
7. **Testes** (Vitest + Testing Library): grid com miniaturas, estado
   vazio, abrir e cancelar o diálogo sem chamar a API, confirmar e chamar
   `deleteWorkImage(workId, imageId)`, invalidação após sucesso, e
   feedback de 401/404/429/500. Atualizar os testes de "Remover imagem" em
   `work-list-item.test.tsx`, que hoje esperam o DELETE sem confirmação.
   Cobertura de pelo menos 80% no código novo ou alterado.

## Fora de escopo

- Qualquer chamada direta ao Cloudinary ou storage externo. O backend
  já apaga no storage e no Mongo.
- Levar imagens para a tela de edição (Opção B, descartada).
- Reordenar imagens, editar `alt` ou `isCover`, ou definir a capa.
- Alterações no upload (CARSHOP-33) além de separar o estado compartilhado
  (item 6).
- Corrigir o comentário desatualizado em `lib/api/works.ts` (divergência 2).
- Criar ou supor endpoints novos, ou fazer mudanças no backend.

## Riscos e dependências

- **CARSHOP-29 (sessão admin)**: já implementada.
- **Capa removida**: se a imagem removida for a capa (`isCover`), o
  comportamento do backend não foi detalhado. A UI apenas reflete o
  refetch. Não inventar regra.
- **`getAdminWorks` sem paginação**: o refetch recarrega todos os works. É
  aceitável pelo padrão atual.

## Critérios de aceite (derivados do DoD)

- [ ] As imagens existentes aparecem em grid (com miniatura) a partir dos
      dados reais do work (`getAdminWorks()` → `work.images`).
- [ ] A remoção chama `DELETE /admin/works/{workId}/images/{imageId}`
      autenticado (Bearer e CSRF via `lib/api/http.ts`).
- [ ] Há confirmação explícita antes de excluir, e cancelar não chama a API.
- [ ] Após o sucesso (200), a imagem some da UI (invalidação e refetch).
- [ ] Erros 401, 404, 429 e 500 têm feedback adequado e acessível.

## Arquivos prováveis

- `app/(admin)/admin/(protected)/trabalhos/work-list-item.tsx` e
  `work-list-item.test.tsx`
- Novo componente de diálogo e/ou grid em `trabalhos/_components/` (ex.
  `delete-work-image-dialog.tsx`, `work-image-grid.tsx`) com os testes
  correspondentes. Nomes e divisão ficam a cargo do `architect`.

## Classificação de tamanho: SMALL (sem `plan.md`)

Justificativa: a camada de dados, a autenticação, o contrato, o refetch e
o padrão de diálogo já existem. O trabalho é de UI em 2 a 4 arquivos da
mesma área, seguindo padrões estabelecidos. A task não é TRIVIAL porque
inclui UI nova (grid e diálogo) e a separação do estado compartilhado com
o upload.

## Próximos agentes

1. `architect` (leve): composição do grid e do diálogo, separação do
   estado upload/remoção e mapeamento de feedback por status
   (401/404/429/500). Admin UI pode usar padrões convencionais
   (`docs/design/`).
2. `developer`, `tester` e `reviewer`, no fluxo normal.

O `knowledge-reader` é opcional: o contrato já foi confirmado. Só vale
chamá-lo se houver interesse em notas do Obsidian sobre remoção de capa.

## Ajustes pós-review

Pendências não bloqueantes do `reviewer`, corrigidas a pedido do usuário
na mesma branch:

1. **Nenhuma nova tentativa após 404.** `DeleteWorkImageDialog` ganhou a
   prop `canConfirm`. Depois de um 404, o diálogo continua aberto com a
   mensagem, mas a ação "Excluir imagem" é omitida e sobra só "Fechar".
   Isso evita um segundo DELETE. O estado volta ao padrão ao abrir uma nova
   remoção. Ao fechar, o foco continua indo para o heading da seção.
2. **Foco do `DeleteWorkDialog`.** Um teste confirmou o problema: o
   diálogo é controlado e não tem `AlertDialogTrigger`, então no
   cancelar/Esc o foco ia para o `body`. O diálogo agora aceita
   `onCloseAutoFocus`, e o `WorkListItem` devolve o foco a "Excluir work".
   Após uma exclusão bem-sucedida, o item é desmontado pelo refetch e o
   foco fica com o padrão do navegador. Levar o foco ao `h1` da página
   exigiria gerenciar foco em `AdminWorkList`/`page.tsx`, o que fica como
   follow-up.
3. **Comentário de `getWorkBySlug` (`lib/api/works.ts`).** Agora reflete o
   contrato real: `GET /works/{slug}` existe, é público e retorna 404 para
   rascunhos e removidos. O comportamento não mudou. Migrar a página
   pública para o endpoint fica como follow-up. `docs/rules/rendering.md`
   (tabela de rendering, linha de Project Details) ainda diz que o
   endpoint não existe e também fica como follow-up.
4. **Nome acessível do heading.** O heading exibe "Imagens (n)" e tem um
   complemento sr-only "do trabalho {título}", para distinguir os cards
   da listagem.
