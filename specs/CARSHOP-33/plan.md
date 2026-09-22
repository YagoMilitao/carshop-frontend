# Plano de implementação — CARSHOP-33

## Status da decisão arquitetural

Aprovado pelo usuário. A spec original presumia ausência de UI de upload e
apontava `edit-work-form.tsx` como alvo — isso foi corrigido pelo
`architect`: o upload de imagens **já existe e funciona** em
`work-list-item.tsx` (listagem "Trabalhos"). O escopo real desta task é
**adicionar preview + confirmação explícita antes do envio** ao fluxo já
existente, não construir upload do zero. `edit-work-form.tsx` **não será
tocado** (fora de escopo, decisão explícita).

O conflito de contrato do campo multipart sinalizado na spec original
(`file` vs. `image`) já foi resolvido pelo usuário a favor do código real:
`lib/api/images.client.ts` usa `POST /admin/works/:workId/images` com o
campo `image` (FormData), sem `alt`/`isCover`. Isso **não muda** nesta
task. Ver risco de reconfirmação abaixo antes do merge final.

## Pré-requisito a confirmar antes de iniciar (bloqueio documentado)

- Reconfirmar o nome do campo multipart (`image`) contra o contrato real
  do backend (Swagger/código do `carshop-backend`, se acessível, ou
  `CARSHOP-124`) antes do merge final. Se o backend divergir, é preciso
  voltar ao `architect`/usuário antes de mesclar — não decidir
  unilateralmente durante a implementação.

## Arquivos a tocar

1. `app/(admin)/admin/(protected)/trabalhos/_components/work-image-upload.tsx`
   (novo)
2. `app/(admin)/admin/(protected)/trabalhos/_components/work-image-upload.test.tsx`
   (novo)
3. `app/(admin)/admin/(protected)/trabalhos/work-list-item.tsx` (modificado)
4. `app/(admin)/admin/(protected)/trabalhos/work-list-item.test.tsx`
   (modificado — ajustar para o novo fluxo de duas etapas)
5. `lib/api/images.client.ts` / `.test.ts` — sem mudança prevista, a menos
   que a reconfirmação do contrato exija ajuste (não esperado).
6. `edit-work-form.tsx` — sem mudança (fora de escopo).

## Ordem de implementação

1. **Criar `work-image-upload.tsx`** (Client Component, `"use client"`),
   seguindo o padrão de apresentação/interação de
   `_components/delete-work-dialog.tsx` (não conhece Axios/mutação —
   recebe callbacks e estado de pending/erro do componente pai):
   - Props: `disabled: boolean` (pending do pai) e
     `onConfirm: (file: File) => Promise<void>` (pai injeta a chamada real
     a `uploadWorkImage`).
   - Input de arquivo com `accept` restrito, sem `multiple` (um arquivo por
     vez, como já é hoje).
   - Ao selecionar arquivo: validar tipo/tamanho client-side reaproveitando
     `ACCEPTED_IMAGE_MIME_TYPES`/`MAX_IMAGE_SIZE_BYTES` de
     `lib/api/images.client.ts`.
     - Inválido → exibir erro inline imediatamente, **sem** chamar a API.
     - Válido → gerar preview local com `URL.createObjectURL`, exibido em
       `<img>` com `alt` descritivo; `URL.revokeObjectURL` no cleanup/troca
       de arquivo (usar `useEffect` ou lógica equivalente para evitar leak
       de memória).
   - Exibir botões "Enviar imagem" e "Cancelar" junto do preview.
     - "Enviar imagem" chama `onConfirm(file)`; em sucesso, limpar preview e
       resetar o input; erro é propagado/tratado pelo componente pai (ver
       passo 2).
     - "Cancelar" apenas limpa o estado local (preview, arquivo
       selecionado, erro de validação) — **não** chama a API.
   - Enquanto `disabled === true` (pending do pai), desabilitar input e
     botões, mostrando texto de estado ("Enviando...").

2. **Integrar em `work-list-item.tsx`**:
   - Substituir o `<input type="file">` inline atual por
     `<WorkImageUpload disabled={...} onConfirm={...} />`.
   - Manter `runMutation` como está hoje; `onConfirm` passa a ser o ponto
     que dispara a chamada real a `uploadWorkImage(work.id, file)` dentro
     de `runMutation`.
   - Manter inalterados: `deleteWorkImage` por imagem, feedback de erro via
     `getApiErrorMessage`, e atualização pós-sucesso
     (`invalidateQueries` + `revalidateWorksTag()` + `router.refresh()`).
   - Não introduzir `useMutation` do TanStack Query nem
     `onUploadProgress`/progresso percentual — fora de escopo, manter o
     padrão manual `useState`/`try-catch` já usado no arquivo.

3. **Ajustar `work-list-item.test.tsx`**:
   - Os testes atuais assumem upload automático disparado no `onChange` do
     `<input>`. Atualizar para o fluxo de duas etapas: selecionar arquivo →
     preview aparece → clicar em "Enviar imagem" → então a chamada a
     `uploadWorkImage` ocorre.
   - Cobrir também o caminho de "Cancelar" (preview desaparece, API não é
     chamada).

4. **Criar `work-image-upload.test.tsx`** cobrindo isoladamente (via
   Vitest + Testing Library, mockando `onConfirm`):
   - Seleção de arquivo válido → preview aparece.
   - Seleção de arquivo com tipo inválido (fora de
     `ACCEPTED_IMAGE_MIME_TYPES`) → erro inline, `onConfirm` não é chamado.
   - Seleção de arquivo acima de `MAX_IMAGE_SIZE_BYTES` → erro inline,
     `onConfirm` não é chamado.
   - Clique em "Enviar imagem" com arquivo válido → `onConfirm` é chamado
     com o `File` correto.
   - Sucesso de `onConfirm` → preview/input são limpos.
   - Clique em "Cancelar" → estado local limpo, `onConfirm` não é chamado.
   - `disabled={true}` → input e botões desabilitados.

5. **Rodar a suíte de testes completa** (`vitest` conforme stack
   configurado no projeto) e validar manualmente subindo o dev server
   (`npm run dev` ou equivalente) para confirmar visualmente o fluxo de
   seleção → preview → envio → atualização da listagem antes de reportar
   concluído.

## Critérios de aceite (derivados do DoD original, reinterpretados ao escopo real)

- [ ] Upload continua utilizando `POST /admin/works/:workId/images` via
      `uploadWorkImage`, com `Authorization Bearer` já injetado
      automaticamente pelo interceptor Axios (`lib/api/http.ts`) — nenhuma
      mudança necessária aqui.
- [ ] Preview da imagem selecionada é exibido **antes** do envio, com
      confirmação explícita do usuário (clique em "Enviar imagem")
      substituindo o envio automático anterior no `onChange`.
- [ ] Arquivos JPEG/PNG/WebP válidos dentro do limite de 5MB são aceitos e
      enviados corretamente após confirmação.
- [ ] Arquivos inválidos (tipo ou tamanho) são rejeitados no client antes
      de qualquer chamada à API, com erro inline.
- [ ] "Cancelar" descarta a seleção sem chamar a API.
- [ ] Erros HTTP (400/401/404/413/415) continuam tratados via
      `getApiErrorMessage`, sem regressão em relação ao comportamento
      atual.
- [ ] A imagem enviada aparece na listagem após sucesso (invalidação de
      cache + `revalidateWorksTag()` + `router.refresh()`), sem regressão.
- [ ] `edit-work-form.tsx` permanece sem alterações.
- [ ] Cobertura de teste ≥80% no componente novo e na integração
      modificada em `work-list-item.tsx`.

## Riscos

- Ajustar `work-list-item.test.tsx` para o novo fluxo de duas etapas é
  trabalho esperado, mas requer atenção para não deixar cobertura
  regredir durante a migração dos testes existentes.
- Vazamento de memória por `URL.createObjectURL` não revogado — mitigar
  explicitamente com `URL.revokeObjectURL` no cleanup/troca de arquivo/
  desmontagem do componente.
- Contrato do campo multipart (`image`) deve ser reconfirmado contra o
  backend real antes do merge final, conforme já registrado na spec —
  não é um risco introduzido por este plano, mas permanece pendente.
- Escopo de seleção múltipla continua explicitamente fora de escopo (um
  arquivo por vez) — não introduzir fila/sequenciamento nesta task.
