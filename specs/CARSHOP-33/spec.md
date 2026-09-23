# CARSHOP-33 — Implementar upload de imagens no admin (preview + envio)

## Metadados da task (Notion Task Tracker)

- **Epic**: Frontend Admin
- **Component**: Images
- **Stack**: Frontend
- **Sprint**: Sprint 6
- **Priority**: Medium
- **Points**: 3
- **Status**: To Do

Descrição, DoD e Notas Técnicas completas: ver task `CARSHOP-33` no Notion
Task Tracker (não duplicadas aqui além do necessário para orientar o
trabalho — ver seções abaixo).

## Conflito de contrato a sinalizar ao usuário (bloqueante para prosseguir)

As Notas Técnicas da task afirmam que "o contrato atual usa campo
multipart `file`". O código real do repositório **já implementa** uma
função de upload que usa um campo diferente:

- `lib/api/images.client.ts` (`uploadWorkImage`) monta o `FormData` com
  `formData.append("image", file)` — campo `image`, não `file` — e não
  envia `alt` nem `isCover`.
- O teste correspondente (`lib/api/images.client.test.ts`) reforça essa
  expectativa: `expect(formData.get("image")).toBe(file)`.
- Esse código foi produzido no escopo da task `CARSHOP-122` (documentação/
  validação do contrato de API), cuja spec (`specs/CARSHOP-122/spec.md`)
  também já registra o endpoint como `POST /admin/works/:workId/images`
  (compatível), mas sem detalhar o nome exato do campo multipart em texto
  — a fonte usada para o nome do campo foi o código já escrito, não um
  contrato revalidado nesta sessão.

Não há, neste repositório, nenhuma documentação do contrato real do
backend (Swagger está desabilitado em produção segundo `CARSHOP-122`) nem
o código do `carshop-backend` para conferir diretamente. Portanto:

- **Isto não é resolvido nesta spec.** O nome exato do campo multipart
  (`file` vs. `image`) e a presença/nome dos campos `alt`/`isCover`
  precisam ser confirmados contra o contrato real do backend (`CARSHOP-124`
  ou o código do `carshop-backend`) antes da implementação, para decidir
  se `lib/api/images.client.ts` deve ser **corrigido** (se `image` estiver
  errado) ou se as Notas Técnicas da CARSHOP-33 estão desatualizadas.
- Sinalizado ao usuário como bloqueio a esclarecer antes de o `developer`
  implementar a integração final.

## Estado real do repositório (verificado nesta sessão)

- **Camada de API de imagens já existe parcialmente**
  (`lib/api/images.client.ts`):
  - `uploadWorkImage(workId, file)` → `POST /admin/works/:workId/images`,
    multipart, campo `image` (ver conflito acima), sem suporte a `alt`/
    `isCover`.
  - `deleteWorkImage(workId, imageId)` → `DELETE
    /admin/works/:workId/images/:imageId`.
  - Constantes já exportadas e testadas: `MAX_IMAGE_SIZE_BYTES` (5MB) e
    `ACCEPTED_IMAGE_MIME_TYPES` (`image/jpeg`, `image/png`, `image/webp`).
  - Nenhum componente de UI consome `uploadWorkImage`/`deleteWorkImage`
    hoje (única referência fora do próprio módulo é o teste unitário) —
    ou seja, **não existe preview, botão de upload, progresso, nem
    tratamento de erro por status HTTP na UI ainda**. Este é o trabalho
    principal desta task.
- **Autenticação admin (CARSHOP-29) já implementada** — dependência
  satisfeita:
  - `lib/api/http.ts`: Axios com `withCredentials: true`, interceptor que
    injeta `Authorization: Bearer <accessToken>` automaticamente em toda
    chamada quando há token em memória (`setAccessToken`/`getAccessToken`).
    `uploadWorkImage`/`deleteWorkImage` já usam esse client (`http`), logo
    **não é necessário adicionar o header Bearer manualmente** — já é
    responsabilidade centralizada do interceptor.
- **Tela de edição de trabalho já existe**:
  `app/(admin)/admin/(protected)/trabalhos/[slug]/editar/edit-work-form.tsx`
  — formulário client-side (React Hook Form + Zod) que edita campos de
  texto do `Work` via `updateWork`. Não tem hoje nenhuma seção de
  gerenciamento de imagens (upload, preview, listagem, exclusão, seleção
  de capa). É o ponto de integração natural para a UI desta task, mas a
  composição exata (seção dentro do mesmo formulário vs. componente
  separado) é decisão do `architect`.
- **Tipo `WorkImage`** (`lib/api/works.ts`): `{ id, url, publicId, alt,
  isCover, order, createdAt, updatedAt }`. `getCoverImage(work)` já existe
  para achar a imagem de capa atual.
- Não há tela/rota admin de "criar novo trabalho" (`trabalhos/novo`) que
  já inclua upload — o fluxo de criação de work (`create-work-form.tsx`)
  também não lida com imagens; o Notion não pede isso explicitamente
  (foco é a tela onde o work já existe, com `workId` disponível), mas o
  `architect` deve confirmar se upload deve ficar disponível apenas na
  edição (mais coerente, já que o endpoint exige `workId` de um work já
  criado) ou também logo após a criação.

## Objetivo

Implementar, na área admin, a interface de upload de imagens de um
trabalho (`Work`) existente: seleção de arquivo com preview antes do
envio, envio multipart para `POST /admin/works/{workId}/images`,
feedback de progresso/sucesso/erro, e exibição da imagem enviada na UI
após sucesso (refetch).

## Escopo (derivado da Descrição/DoD)

1. **Resolver o conflito de contrato** (campo `file` vs. `image`, suporte
   a `alt`/`isCover`) antes ou no início da implementação — ver seção de
   conflito acima. Ajustar `lib/api/images.client.ts` conforme o contrato
   confirmado.
2. **UI de seleção + preview**: input de arquivo (ou dropzone) que aceita
   apenas JPEG/PNG/WebP, valida tamanho até 5MB no client (UX; backend é
   fonte de verdade final), e exibe preview local (ex. `URL.
   createObjectURL`/`FileReader`) antes do envio.
3. **Envio multipart**: usar `uploadWorkImage` (ajustada conforme o
   contrato correto) com `Authorization Bearer` já injetado
   automaticamente pelo `http` client — nenhuma lógica de auth adicional
   necessária aqui.
4. **Feedback de progresso/sucesso/erro**: estado de loading durante o
   upload (spinner/desabilitar ação), toast/mensagem de sucesso, e
   tratamento específico para os status 400/401/404/413/415 com mensagens
   compreensíveis ao usuário (reaproveitar `getApiErrorMessage`, já usado
   em `edit-work-form.tsx`, se compatível com esses status; caso não
   cubra os casos exigidos, estender ou complementar — decisão do
   `developer` seguindo padrão existente).
5. **Seleção múltipla (se a UX permitir)**: se o `architect`/`developer`
   decidir permitir selecionar mais de um arquivo na UI, as chamadas de
   upload devem ser sequenciais/controladas (uma requisição por arquivo),
   nunca uma única request com múltiplos arquivos — o endpoint aceita um
   arquivo por requisição.
6. **Atualização da UI após sucesso**: a imagem enviada deve aparecer na
   tela após sucesso/refetch (ex. invalidar a query de works admin já
   usada em `edit-work-form.tsx`, mesmo padrão do `updateWork`).
7. **Local de integração**: adicionar a seção de gerenciamento de imagens
   na tela de edição de trabalho existente
   (`trabalhos/[slug]/editar/edit-work-form.tsx` ou um componente novo
   dedicado renderizado ali) — decisão exata de composição/estrutura é do
   `architect`.
8. **Testes**: cobertura da camada de dados ajustada
   (`images.client.ts`/teste correspondente) e dos novos componentes de
   UI (seleção, preview, envio, tratamento de cada status de erro
   relevante), seguindo o stack de testes já configurado.

## Fora de escopo

- Exclusão de imagem (`deleteWorkImage`) já existe na camada de dados mas
  **não está no DoD desta task** — se a UX exigir um botão de remover
  como parte natural da mesma seção, isso deve ser tratado como uma
  extensão explícita a confirmar com o usuário/Notion, não presumida
  silenciosamente aqui.
- Reordenar imagens (`order`) ou editar `alt`/`isCover` de imagens já
  enviadas (fora do momento do upload) — não mencionado no DoD.
- Qualquer alteração no backend (`carshop-backend`), Cloudinary/storage
  externo, ou nas variáveis de ambiente/configuração desses serviços —
  tratado como dependência externa já configurada, conforme a task.
- Upload de imagens no fluxo de criação de trabalho (`trabalhos/novo`) —
  fora do DoD explícito; ver observação no estado do repositório acima
  sobre a decisão do `architect` a esse respeito.
- Corrigir a divergência de nome de campo em `CARSHOP-122`/documentar
  retroativamente o contrato geral da API — apenas o campo usado por este
  endpoint específico é resolvido aqui.

## Riscos / Dependências

- **Conflito de contrato do campo multipart** (`file` vs. `image`) — ver
  seção dedicada acima; bloqueia a implementação final até confirmação.
- **CARSHOP-124** (contrato do backend) — dependência externa de
  documentação/confirmação; não há Swagger acessível em produção segundo
  `CARSHOP-122`.
- **CARSHOP-29** (sessão admin) — já implementada e reutilizável, sem
  risco adicional identificado.
- **Cloudinary/storage externo configurado no backend** — dependência
  externa, fora deste repositório; falhas de upload por esse motivo devem
  aparecer como erro 4xx/5xx tratado pela UI, não como bug do frontend.
- **Tratamento de 413 (payload too large)**: validar se o Axios/backend
  retornam um corpo de erro consistente para esse status; se o servidor
  rejeitar antes de um corpo JSON completo (comum em alguns proxies), a
  mensagem de erro genérica de fallback deve ser usada.
- **UX de seleção múltipla**: decisão de permitir ou não múltiplos
  arquivos de uma vez é do `architect`/`developer`; se permitida, exige
  controle de fila/sequenciamento (evitar disparar N requisições
  paralelas sem controle), o que adiciona complexidade de estado.

## Critérios de aceite (derivados do DoD do Notion)

- [ ] Upload utiliza `POST /admin/works/{workId}/images` com
      `Authorization Bearer` (já injetado pelo `http` client existente).
- [ ] Preview da imagem selecionada funciona antes do envio.
- [ ] Arquivos JPEG/PNG/WebP válidos dentro do limite de 5MB são enviados
      corretamente.
- [ ] Erros 400/401/404/413/415 são tratados com feedback adequado ao
      usuário.
- [ ] A imagem enviada aparece na UI após sucesso/refetch.
- [ ] Caso a UI permita seleção múltipla, o envio respeita o contrato de
      um arquivo por requisição (chamadas controladas, não paralelas sem
      limite).

## Arquivos prováveis a tocar

- `lib/api/images.client.ts` e `lib/api/images.client.test.ts` (ajuste do
  campo multipart e, se aplicável, suporte a `alt`/`isCover`, conforme
  contrato confirmado).
- `app/(admin)/admin/(protected)/trabalhos/[slug]/editar/edit-work-form.tsx`
  (integração da seção de imagens) e/ou novo componente dedicado (ex.
  `work-image-upload.tsx` ou similar, em
  `app/(admin)/admin/(protected)/trabalhos/[slug]/editar/` ou
  `trabalhos/_components/`) — nome/local exato é decisão do `architect`.
- Testes correspondentes aos novos componentes de UI.
- Possível reuso/extensão de `getApiErrorMessage`
  (`lib/api/auth.client.ts`) se precisar cobrir os status 400/404/413/415
  de forma mais específica do que hoje.

## Classificação de tamanho: NON-TRIVIAL

Justificativa: a task exige (a) resolver um conflito de contrato de API
não trivial (nome do campo multipart, ausência de `alt`/`isCover` no
código atual) antes de implementar, o que é uma decisão que não pode ser
tomada unilateralmente pelo `developer`; (b) construir UI nova (seleção de
arquivo, preview, progresso, feedback) que hoje não existe em nenhum
componente do repositório, envolvendo múltiplos arquivos (camada de dados
+ pelo menos um novo componente de UI + integração na tela de edição já
existente + testes); (c) tratamento diferenciado de 5 status HTTP
distintos de erro; e (d) uma decisão de composição de UI (onde/como
integrar na tela de edição, se cria componente dedicado, se permite
seleção múltipla) que se enquadra em decisão arquitetural/estrutural de
UI, não apenas implementação mecânica. Não se enquadra em TRIVIAL (não é
mudança pontual e de baixo risco) nem em SMALL (múltiplos arquivos/áreas
e existe decisão de contrato/arquitetura pendente). **Plano obrigatório
via `plan-writer`.**

## Próximos agentes necessários

1. **Sinalizar ao usuário**, antes de prosseguir: o conflito entre o
   campo multipart usado hoje em `lib/api/images.client.ts` (`image`) e o
   que as Notas Técnicas da CARSHOP-33 descrevem (`file`), incluindo a
   ausência de `alt`/`isCover` no payload atual — precisa de confirmação
   contra o contrato real do backend (`CARSHOP-124` ou código do
   `carshop-backend`) antes de codificar.
2. `knowledge-reader` — consultar Obsidian por decisões/notas prévias
   sobre upload de imagens, Cloudinary, ou o contrato de
   `POST /admin/works/:workId/images` (ex. registradas durante
   `CARSHOP-122`), e por padrões já estabelecidos de tratamento de erro
   HTTP por status na UI admin.
3. `architect` — definir a estrutura visual/estrutural: onde a seção de
   imagens é renderizada (dentro de `edit-work-form.tsx` vs. componente
   dedicado), estratégia de preview, estratégia de progresso/feedback
   (toast vs. inline), se seleção múltipla é permitida e como o
   sequenciamento de requisições é controlado nesse caso, e como os 5
   status de erro são mapeados para mensagens ao usuário — seguindo
   `docs/design/` (Admin UI pode usar padrões convencionais de aplicação,
   conforme `CLAUDE.md`).
4. `plan-writer` — persistir `plan.md` (task NON-TRIVIAL), detalhando a
   resolução do conflito de contrato, sequência de implementação,
   arquivos exatos e casos de teste (incluindo cada status de erro).
