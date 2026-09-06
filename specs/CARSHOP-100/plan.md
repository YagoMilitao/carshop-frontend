# CARSHOP-100 — Plano de implementação

Consolida `specs/CARSHOP-100/spec.md` com as decisões já fechadas pelo
`architect`, `knowledge-reader` e usuário. Este plano não reabre nenhuma
decisão listada abaixo — apenas sequencia a implementação para o
`developer`. Nenhuma linha de código é escrita aqui.

## Decisões fechadas (não revisitar)

Resolvem os dois conflitos deixados em aberto pela spec:

1. **Runner de testes**: mantém-se Vitest (já configurado no repositório,
   compatível com Next.js App Router atual). Nenhuma migração para outro
   runner nesta task.
2. **Compatibilidade Shadcn/UI com Next 16.3.4 / React 19.2.0**: não
   assumida de antemão. É tratada como bloqueio a verificar no Passo 2 —
   ver "Bloqueio a confirmar" abaixo.

Demais decisões arquiteturais (estrutura de pastas, Axios vs fetch,
posicionamento dos providers, boundaries de Client Components, ícones
Shadcn/lucide-react vs React Icons) estão descritas na seção
"Decisões arquiteturais de referência" e devem ser seguidas literalmente
pelo `developer`.

## Bloqueio a confirmar antes/durante a implementação

Antes de rodar o CLI de init do Shadcn/UI (Passo 2), o `developer` deve
consultar a documentação oficial atual do Shadcn/UI para confirmar
compatibilidade com Next 16.3.4 + React 19.2.0 (incluindo qual versão do
Tailwind o CLI espera — v3 com `tailwind.config.ts` ou v4 CSS-first).

- Se compatível: seguir a documentação oficial vigente no momento do
  setup, registrando no PR/README a versão do Tailwind escolhida e o
  motivo.
- Se houver conflito de peer dependencies: preferir overrides documentados
  (`overrides`/`resolutions` no `package.json`, com comentário explicando o
  motivo) em vez de downgrade silencioso de Next ou React.
- Se não houver forma compatível de prosseguir sem downgrade de Next/React
  ou sem overrides não documentados oficialmente: **parar e reportar o
  bloqueio ao usuário** antes de continuar os passos seguintes. Não
  contornar por conta própria.

## Decisões arquiteturais de referência (architect)

- **Estrutura de pastas** (raiz do repo, sem `src/`):
  - `components/ui/` — primitivos gerados pelo Shadcn/UI.
  - `components/` — componentes compostos reutilizados entre rotas.
  - `app/(admin)/admin/<feature>/_components/` e
    `app/(public)/_components/` — componentes específicos de uma única
    rota/feature.
  - `lib/utils.ts` — helper `cn()` (clsx + tailwind-merge), padrão Shadcn.
  - `lib/api/http.ts` — instância única do Axios (client centralizado,
    ADR-001: nenhuma feature instancia Axios ou usa `fetch` diretamente
    para chamadas client-side). `lib/api/<recurso>.ts` para módulos por
    recurso quando necessário.
  - `app/providers.tsx` — Client Component único (`"use client"`)
    hospedando `QueryClientProvider`, com `QueryClient` criado via
    `useState(() => new QueryClient())`; montado em `app/layout.tsx`
    envolvendo `{children}`. `app/layout.tsx` permanece Server Component.
  - `schemas/<domain>.ts` — schemas Zod compartilhados entre múltiplos
    formulários; schema de uso único fica junto do componente do formulário.
  - `components.json` (Shadcn) na raiz, aliases apontando para
    `./components` e `./lib` (nunca `./src/*`).
- **Axios vs fetch**: Axios restrito a Client Components/hooks que
  alimentam `useQuery`/`useMutation`. Server Components e fetching
  server-side usam `fetch` nativo do Next. `baseURL` do Axios reaproveita
  `clientEnv.NEXT_PUBLIC_API_URL` de `lib/env/client.ts` (nunca ler
  `process.env` diretamente). Nenhum endpoint/contrato além do que já
  existe no backend deve ser inventado.
- **React Hook Form + Zod**: todo componente com `useForm` é Client
  Component. Padrão: `type FormValues = z.infer<typeof schema>` e
  `useForm<FormValues>({ resolver: zodResolver(schema) })`. Requer
  `@hookform/resolvers` como dependência adicional.
- **Framer Motion**: `"use client"` apenas no componente que efetivamente
  usa `motion.*`/hooks de animação — menor boundary possível, nunca no
  layout ou em componentes puramente estruturais.
- **React Icons**: SVGs puros, não exigem `"use client"` por si só; padrão
  de iconografia em código de aplicação.
- **lucide-react (decisão consciente)**: os primitivos gerados pelo
  Shadcn/UI usam `lucide-react` internamente. Isso é aceito como
  dependência restrita aos componentes gerados pelo Shadcn
  (`components/ui/*`) — não usar `lucide-react` em código de aplicação.
  React Icons continua sendo o padrão de iconografia fora de
  `components/ui/`. Não é uma violação do DoD "React Icons instalado para
  iconografia padronizada", pois esse critério se refere a código de
  aplicação.
- **tsconfig.json**: adicionar `"paths": { "@/*": ["./*"] }` (hoje ausente),
  necessário para os imports gerados pelo Shadcn/UI.
- **Dependências adicionais implícitas** (além das citadas no DoD):
  `clsx`, `tailwind-merge`, `class-variance-authority`,
  `@hookform/resolvers`, e o necessário para Tailwind conforme confirmado
  no bloqueio acima (v3 + `tailwind.config.ts` ou v4 CSS-first).

## Fora de escopo

- Nenhuma migração de backend Express.
- Nenhuma rota nova além dos providers estritamente necessários.

## Ordem de implementação

1. **TailwindCSS**
   - Confirmar na documentação oficial atual a forma de integração
     suportada para Next 16.3.4 (v3 com PostCSS + `tailwind.config.ts` ou
     v4 CSS-first).
   - Instalar dependências e configurar diretiva Tailwind no CSS global do
     App Router (`app/globals.css`), sem tocar em rotas existentes além do
     necessário para carregar o CSS global.

2. **Shadcn/UI**
   - Verificar o bloqueio de compatibilidade descrito acima antes de
     rodar o CLI de init.
   - Rodar init do Shadcn/UI com `components.json` na raiz, aliases
     apontando para `./components` e `./lib`.
   - Gerar apenas os primitivos de UI estritamente necessários nesta task
     (evitar gerar componentes especulativos sem uso).
   - Criar `lib/utils.ts` com `cn()` (clsx + tailwind-merge), conforme
     dependências geradas pelo próprio Shadcn.

3. **Axios + client HTTP centralizado**
   - Criar `lib/api/http.ts` com instância única do Axios, `baseURL`
     lendo `clientEnv.NEXT_PUBLIC_API_URL` de `lib/env/client.ts`.
   - Não criar módulos `lib/api/<recurso>.ts` especulativos sem uso real
     nesta task; criar apenas se algo consumir imediatamente.
   - Confirmar que nenhum outro ponto do código instancia Axios
     diretamente ou usa `fetch` para o mesmo propósito client-side
     (ADR-001).

4. **TanStack Query + provider**
   - Criar `app/providers.tsx` (`"use client"`) com `QueryClientProvider`
     e `QueryClient` via `useState(() => new QueryClient())`.
   - Montar `<Providers>` em `app/layout.tsx` envolvendo `{children}`,
     mantendo `app/layout.tsx` como Server Component.
   - Não introduzir uso de `useQuery`/`useMutation` fora do escopo desta
     task além do necessário para validar o provider (sem inventar
     features novas).

5. **React Hook Form + Zod**
   - Instalar `react-hook-form` e `@hookform/resolvers` (Zod já
     instalado).
   - Se houver algum formulário mínimo necessário para validar a
     integração (ex.: exemplo/smoke), seguir o padrão
     `FormValues = z.infer<typeof schema>` +
     `useForm<FormValues>({ resolver: zodResolver(schema) })`, componente
     como Client Component. Se não houver formulário real no escopo desta
     task, deixar apenas a configuração/dependências prontas, sem criar
     formulário fictício só para exercitar a lib.

6. **Framer Motion**
   - Instalar a dependência.
   - Se houver uso real nesta task, aplicar `"use client"` apenas no
     componente que usa `motion.*`, nunca em boundary maior.

7. **React Icons**
   - Instalar a dependência.
   - Confirmar que `lucide-react` (trazido pelo Shadcn) permanece restrito
     a `components/ui/*`, e que código de aplicação usa React Icons.

8. **Ajustar `tsconfig.json`**
   - Adicionar `"paths": { "@/*": ["./*"] }`.
   - Confirmar que os imports gerados pelo Shadcn/UI resolvem
     corretamente com esse alias, sem introduzir `any`/`as any`.

9. **Validar testes, build, lint e typecheck**
   - Rodar `test`, `test:coverage`, `typecheck`, `lint`, `build`.
   - Garantir que a stack de testes (Vitest + Testing Library) continua
     operante com as novas dependências (ex.: eventuais ajustes de
     `vitest.config.ts`/setup para lidar com CSS do Tailwind ou mocks de
     Axios, sem migrar de runner).
   - Cobertura ≥80% em código novo/alterado desta task, sem testes
     artificiais criados apenas para atingir número de cobertura.
   - Confirmar que nenhuma dependência residual do Vite permanece sem
     justificativa (revisar `package.json` final).

10. **Atualizar README/documentação**
    - Atualizar `README.md` refletindo a stack final instalada, comandos
      disponíveis e, se aplicável, decisão de versão do Tailwind adotada
      (com justificativa breve, sem detalhar segredos/valores de `.env`).

## Critérios de aceite (herdados da spec — checklist de saída)

- [ ] TailwindCSS configurado conforme integração suportada pela versão
      atual do Next.js.
- [ ] Shadcn/UI inicializado de forma compatível com Next.js/Tailwind, com
      bloqueio de compatibilidade verificado e documentado (resolvido ou
      escalado ao usuário).
- [ ] TanStack Query instalado, provider mínimo client-side em
      `app/providers.tsx`.
- [ ] Axios instalado e centralizado em `lib/api/http.ts` (client único,
      ADR-001 respeitado).
- [ ] React Hook Form + Zod configurados para formulários client-side
      tipados (`@hookform/resolvers` incluído).
- [ ] Framer Motion instalado, uso restrito à menor boundary client.
- [ ] React Icons instalado como padrão de iconografia em código de
      aplicação; `lucide-react` restrito a `components/ui/*`.
- [ ] Stack de testes (Vitest + Testing Library) mantida e validada.
- [ ] Scripts `test`/`test:coverage`/`typecheck`/`lint`/`build` passando.
- [ ] Cobertura ≥80% em código novo/alterado, sem testes artificiais.
- [ ] React Router não instalado; nenhuma dependência Vite residual sem
      justificativa.
- [ ] TypeScript strict mantido: sem `any`, `as any`, `@ts-ignore`/
      `@ts-expect-error`.
- [ ] Providers mínimos, sem Client Components desnecessários.
- [ ] Nenhum contrato de backend inventado.
- [ ] Configuração de ambiente segue `lib/env/*` (CARSHOP-99), sem leitura
      direta de `process.env` fora desse módulo.
- [ ] `tsconfig.json` com `"paths": { "@/*": ["./*"] }` adicionado.
- [ ] `components.json` na raiz com aliases para `./components` e `./lib`.
- [ ] README/documentação atualizados.

## Riscos residuais a observar durante a implementação

- Ordem de providers (`QueryClientProvider` vs eventuais outros
  providers futuros) — manter `app/providers.tsx` como único ponto de
  composição para evitar múltiplos Client Components de provider na raiz.
- CSS global do Tailwind coexistindo com estilos gerados pelo Shadcn/UI —
  validar visualmente/via build que não há conflito de reset de estilos.
- Overrides de peer dependencies (se necessários para o bloqueio do Passo
  2) devem ser documentados no `package.json` e mencionados no README/PR,
  nunca aplicados silenciosamente.
