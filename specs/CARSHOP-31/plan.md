# CARSHOP-31 — Plano de implementação

Plano persistido a partir da spec (`specs/CARSHOP-31/spec.md`) e da decisão
arquitetural aprovada. Segue a ordem abaixo sequencialmente. Cada passo tem
um critério de verificação — não avançar para o próximo sem confirmá-lo.

## Bloqueio a confirmar antes de implementar

- CARSHOP-32 (fluxo de edição) não está implementado. A decisão já aprovada
  é: manter o botão "Editar" **desabilitado** (`variant="outline"`,
  `size="sm"`, `disabled`, `aria-disabled="true"`,
  `title="Disponível em breve"`), sem componente novo nem rota placeholder.
  Nenhuma rota de edição real é criada nesta tarefa. Se essa decisão for
  contestada pelo usuário durante a implementação, parar e confirmar antes
  de prosseguir.

## Passos

1. **Criar `components/ui/alert-dialog.tsx`.**
   - Primitivos Shadcn/Radix: `AlertDialog`, `AlertDialogTrigger`,
     `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`,
     `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`,
     `AlertDialogCancel`.
   - Importar via `import { AlertDialog as AlertDialogPrimitive } from "radix-ui"`
     (mesmo pacote já usado em `components/ui/dialog.tsx` — não adicionar
     dependência nova).
   - Seguir o mesmo padrão de `data-slot`, estilos Tailwind e
     estrutura/composição de `components/ui/dialog.tsx`.
   - Verificação: `tsc`/build não acusa erro de tipos; componente exporta as
     mesmas peças usadas pelo Shadcn AlertDialog padrão.

2. **Criar `app/(admin)/admin/(protected)/trabalhos/page.tsx` (Server Component).**
   - Sem `"use client"`.
   - `export const metadata` com `robots: { index: false, follow: false }`
     (mesmo padrão do Dashboard).
   - Usa `PageSection`/`Container` (mesmo padrão visual do Dashboard).
   - Heading da página (ex.: "Trabalhos").
   - Botão "Novo trabalho" (`Button` + `Link` para `/admin/trabalhos/novo`).
   - Renderiza `<AdminWorkList />` (import do novo caminho, ver passo 3).
   - Verificação: rota acessível, sem duplicar `<main>` (o layout do admin já
     fornece o landmark).

3. **Mover `admin-work-list.tsx` para dentro de `trabalhos/`.**
   - `app/(admin)/admin/(protected)/admin-work-list.tsx` →
     `app/(admin)/admin/(protected)/trabalhos/admin-work-list.tsx`.
   - Mover também `admin-work-list.test.tsx` junto.
   - Sem mudança de API pública nem de lógica: mesma `useQuery` com
     `adminWorksQueryKey`/`getAdminWorks`.
   - Ajustar todos os imports relativos afetados pela mudança de diretório
     (o arquivo sobe um nível: de `(protected)/` para `(protected)/trabalhos/`).
   - Verificação: `git mv` preferencialmente (preserva histórico); nenhum
     import quebrado.

4. **Mover `work-list-item.tsx` para dentro de `trabalhos/` e implementar
   confirmação de exclusão + botão "Editar" desabilitado.**
   - `app/(admin)/admin/(protected)/work-list-item.tsx` →
     `app/(admin)/admin/(protected)/trabalhos/work-list-item.tsx` (+ mover
     `work-list-item.test.tsx`).
   - Ajustar import relativo de `../actions` para `../../actions` (o arquivo
     desce um nível a mais em relação à raiz `(protected)/`).
   - Trocar o `onClick` direto do botão "Excluir work" por abertura do
     `DeleteWorkDialog` (estado local `open`/`isPending`/`error`). A chamada
     real a `deleteWork` + `runMutation` (invalidar query, chamar
     `revalidateWorksTag()`, `router.refresh()`) só deve disparar quando o
     admin confirmar no `AlertDialogAction`.
   - Adicionar botão "Editar" ao lado do botão "Excluir": `variant="outline"`,
     `size="sm"`, `disabled`, `aria-disabled="true"`,
     `title="Disponível em breve"`. Sem componente novo, sem rota
     placeholder.
   - Verificação: nenhuma chamada a `deleteWork` ocorre sem confirmação
     explícita; botão "Editar" é visivelmente não-interativo e não navega
     para lugar nenhum.

5. **Criar `app/(admin)/admin/(protected)/trabalhos/_components/delete-work-dialog.tsx`
   (+ teste).**
   - Client Component de apresentação (`"use client"`), sem conhecer
     `deleteWork`/Axios diretamente.
   - Props: `open`, `onOpenChange`, `workTitle`, `onConfirm`, `isPending`,
     `error`.
   - Usa os primitivos de `components/ui/alert-dialog.tsx` criados no
     passo 1.
   - `AlertDialogAction` com `variant="destructive"` do `Button` já
     existente; desabilitado durante `isPending`.
   - Erro exibido via `getApiErrorMessage` (mesmo padrão já usado em
     `WorkListItem`), de forma acessível.
   - Verificação: diálogo abre/fecha corretamente, botão de confirmação
     desabilita durante pending, mensagem de erro aparece quando `error` é
     passado.

6. **Editar `app/(admin)/admin/(protected)/page.tsx` (Dashboard).**
   - Remover a seção "Works" inteira (heading, botão "Novo trabalho"
     duplicado, `<AdminWorkList />`) e o import de `AdminWorkList`.
   - Manter as seções "Visão geral" (`DashboardSummary`) e "Comentários"
     intactas, sem alteração de comportamento.
   - Verificação: Dashboard não referencia mais `AdminWorkList` nem duplica
     a listagem de works.

7. **Editar `app/(admin)/admin/(protected)/page.test.tsx`.**
   - Remover/ajustar asserções relacionadas à listagem de works que deixou
     de existir no Dashboard.
   - Verificação: suíte de testes do Dashboard passa sem referenciar
     `AdminWorkList`/works.

8. **Editar `app/(admin)/admin/(protected)/_components/admin-nav-links.ts`.**
   - Adicionar item `{ href: "/admin/trabalhos", label: "Trabalhos" }` entre
     "Dashboard" e "Novo trabalho".
   - Verificação: array de links reflete a nova entrada, sem quebrar ordem
     esperada pelos demais itens.

9. **Verificar/ajustar testes de navegação (somente se necessário).**
   - `admin-nav-link.test.tsx`, `admin-sidebar.test.tsx`,
     `admin-mobile-nav.test.tsx`: ajustar apenas se fixarem contagem/ordem
     exata de itens do menu.
   - Verificação: suítes passam refletindo o novo item de menu.

10. **Criar `app/(admin)/admin/(protected)/trabalhos/page.test.tsx`.**
    - Cobrir: renderização da listagem (via `AdminWorkList` mockado ou
      integração conforme padrão já usado nos testes existentes), presença
      do botão "Novo trabalho" apontando para `/admin/trabalhos/novo`.
    - Verificação: teste passa e cobre o caminho principal da página.

11. **Reescrever testes de exclusão para o fluxo com confirmação.**
    - `work-list-item.test.tsx` (já movido no passo 4): reescrever os casos
      que hoje assumem clique direto sem diálogo — passam a abrir o
      `AlertDialog`, confirmar, e só então asserir a chamada a `deleteWork`
      e os efeitos (invalidate query, `revalidateWorksTag()`,
      `router.refresh()`). Cobrir também o caso de erro da API exibido via
      `getApiErrorMessage`.
    - `admin-work-list.test.tsx` (já movido no passo 3): ajustar apenas o
      que depender do novo caminho de import; lógica de listagem em si não
      muda.
    - `delete-work-dialog.test.tsx` (criado no passo 5): cobrir abertura,
      confirmação, cancelamento, estado `isPending` e exibição de erro.
    - Verificação: nenhuma chamada a `deleteWork` é feita sem passar pela
      confirmação nos testes; cobertura de novo código/código alterado
      atinge pelo menos 80% quando aplicável.

12. **Checagem final de imports e build.**
    - Buscar por referências residuais aos caminhos antigos
      (`admin-work-list`, `work-list-item`) fora de `trabalhos/` que não
      tenham sido atualizadas.
    - Rodar lint, type-check e suíte de testes completa.
    - Subir o dev server localmente e validar manualmente:
      `/admin/trabalhos` lista works (incluindo drafts), botão "Novo
      trabalho" navega corretamente, botão "Editar" está visivelmente
      desabilitado, exclusão exige confirmação via `AlertDialog` e trata
      erro da API, Dashboard (`/admin`) não duplica mais a listagem de
      works.

## Critérios de aceite (do DoD, para referência do developer/tester/reviewer)

1. Admin autenticado acessa `/admin/trabalhos` e vê a lista de works,
   incluindo drafts.
2. Botão "Novo trabalho" navega para `/admin/trabalhos/novo`.
3. Botão "Editar" existe por work e está desabilitado (CARSHOP-32 pendente).
4. Excluir um work exige confirmação explícita via `AlertDialog` antes de
   disparar `DELETE /admin/works/{workId}`.
5. Erros da API de exclusão são exibidos ao admin de forma acessível (via
   `getApiErrorMessage`).
6. Dashboard (`/admin`) não duplica mais a listagem de works — comportamento
   consistente com a decisão de mover a listagem para `/admin/trabalhos`.

## Fora de escopo (reforço)

- Implementar o fluxo de edição em si (CARSHOP-32).
- Alterar contrato de backend (`GET /works`, `DELETE /admin/works/{workId}`).
- Qualquer mudança em `POST /works` ou em `trabalhos/novo/**` além de
  garantir que o link "Novo trabalho" continue funcionando.
