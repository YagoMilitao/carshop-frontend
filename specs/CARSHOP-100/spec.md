# CARSHOP-100 — Instalar e configurar stack frontend padrão sobre Next.js

## Metadados (Notion Task Tracker)

- **ID**: CARSHOP-100
- **Epic**: Frontend Base
- **Sprint**: Sprint 3
- **Priority**: High
- **Points**: 8
- **Component**: Public UI, Admin UI, Infra, Quality
- **Stack**: Frontend
- **Status**: To Do

Descrição, DoD e Notas Técnicas completas: ver task CARSHOP-100 no Notion
(Task Tracker). Este documento resume apenas o necessário para execução e
não duplica o conteúdo integral da task.

## Resumo do escopo

Com a migração Vite → Next.js App Router já concluída (confirmado no
repositório atual: `package.json` 100% Next.js, sem React Router nem
dependências específicas do Vite além do runner de testes), esta task
instala e configura a stack complementar oficial definida para o CarShop
Frontend:

- TailwindCSS
- Shadcn/UI
- TanStack Query (provider client-side mínimo)
- Axios (uso client-side onde fizer sentido; Server Components não são
  obrigados a usar Axios)
- React Hook Form + Zod (Zod já instalado; falta integração RHF)
- Framer Motion
- React Icons
- Stack de testes adequada ao Next/React (Testing Library + runner
  aprovado)

Princípio norteador (Notas Técnicas): usar Server Components/rendering do
Next para conteúdo público quando apropriado; TanStack Query apenas para
server state interativo no cliente; estado local em React state; formulários
com RHF+Zod. Nenhuma lib deve ser adicionada "porque está instalada".

## Estado real confirmado (não precisa reverificar)

- `dependencies`: next ^16.3.4, react ^19.2.0, react-dom ^19.2.0,
  server-only ^0.0.1, zod ^4.5.4.
- `devDependencies`: eslint (+ config-next), typescript,
  typescript-eslint, @testing-library/jest-dom, @testing-library/react,
  @testing-library/user-event, jsdom, vitest, @vitest/coverage-v8,
  @vitejs/plugin-react, @types/node, @types/react, @types/react-dom,
  globals.
- Scripts existentes: `dev`, `build`, `start`, `lint`, `typecheck`,
  `test`, `test:watch`, `test:coverage`, `validate:agents`.
- Não instalados ainda: TailwindCSS, Shadcn/UI, TanStack Query, Axios,
  React Hook Form, Framer Motion, React Icons.
- Não há React Router no projeto.

## Conflitos/ambiguidades a sinalizar ao usuário (não resolvidos aqui)

1. **Runner de testes atual (Vitest + @vitejs/plugin-react) vs "runner
   tecnicamente compatível/aprovado" do DoD.** O DoD não define
   explicitamente se Vitest deve ser mantido ou substituído (ex.: Jest com
   next/jest, historicamente mais comum em projetos Next.js). `vitest` e
   `@vitejs/plugin-react` são tecnicamente dependências originadas do setup
   Vite; o DoD pede para não manter dependências específicas do Vite "sem
   justificativa". Isso é uma decisão arquitetural (manter Vitest com
   justificativa técnica de compatibilidade, ou migrar para outro runner) —
   não deve ser resolvida pelo `spec-writer`; recomenda-se decisão explícita
   do `architect` e/ou do usuário antes da implementação.
2. **Compatibilidade Shadcn/UI com Next.js 16.3.4 / React 19.2.0.** Ambas
   as versões são recentes; a compatibilidade oficial do CLI/templates do
   Shadcn/UI com essa combinação específica deve ser confirmada na
   documentação oficial no momento do setup (Notas Técnicas já pedem
   consulta à documentação atual das bibliotecas). Se houver
   incompatibilidade, isso é um bloqueio a reportar, não a contornar com
   downgrade silencioso de versões já em uso.

Nenhum outro conflito de escopo identificado: a pré-condição do DoD ("só
executar após migração para Next.js App Router concluída") já está
satisfeita pelo estado atual do repositório.

## Áreas/arquivos esperados (não exaustivo — decisão fina cabe a
`architect`/`developer`)

- `package.json` / lockfile — novas dependências e possível ajuste de
  scripts (`test`, `test:coverage`, etc., conforme decisão do runner).
- Configuração TailwindCSS (arquivo(s) de config + diretiva Tailwind no
  CSS global do App Router, ex. `app/globals.css`).
- Configuração Shadcn/UI (arquivo `components.json` e estrutura de
  componentes UI gerada, tipicamente `components/ui/`).
- Provider client-side do TanStack Query (novo Client Component de
  provider, montado no ponto mínimo necessário da árvore — não
  necessariamente no root layout inteiro).
- Módulo/instância Axios (infra HTTP client-side), possivelmente ao lado
  do módulo de acesso à API já criado na task de variáveis de ambiente
  (CARSHOP-99).
- Configuração de testes (arquivo de config do runner escolhido,
  eventual `vitest.config.ts`/`jest.config.ts`, setup files de Testing
  Library).
- `README.md` / documentação — atualização refletindo a stack final
  instalada e comandos disponíveis.
- `eslint`/`tsconfig` — ajustes pontuais apenas se exigidos pelas novas
  libs (ex. paths do Shadcn/UI), sem alterar o rigor do TypeScript strict.

Nenhum contrato de backend deve ser inventado nesta task (infra HTTP client
apenas, sem endpoints fictícios).

## Critérios de aceite (derivados do DoD)

- [ ] TailwindCSS configurado e funcional com a versão atual do Next.js.
- [ ] Shadcn/UI inicializado e compatível com Next.js/Tailwind já
      configurados.
- [ ] TanStack Query instalado, com provider client-side aplicado somente
      onde necessário (sem substituir fetching server-side do Next
      indiscriminadamente).
- [ ] Axios instalado e usado apenas em infraestrutura client-side onde
      fizer sentido; Server Components mantêm liberdade de estratégia
      server-side própria.
- [ ] React Hook Form + Zod configurados para formulários client-side
      tipados.
- [ ] Framer Motion instalado, com uso restrito a Client Components
      justificados.
- [ ] React Icons instalado para iconografia padronizada.
- [ ] Stack de testes (Testing Library + runner aprovado) configurada e
      operante.
- [ ] Scripts de test/coverage/typecheck/lint/build disponíveis e
      coerentes com a arquitetura final.
- [ ] Cobertura ≥80% em código novo/alterado, sem testes artificiais.
- [ ] React Router não instalado (já satisfeito hoje; validar que
      permanece assim).
- [ ] Nenhuma dependência específica do Vite permanece sem justificativa
      explícita (ver conflito #1 acima).
- [ ] TypeScript strict mantido: sem `any`, `as any` ou `@ts-ignore`.
- [ ] Providers mínimos; nenhum Client Component criado apenas para
      envolver a aplicação inteira desnecessariamente.
- [ ] Nenhum contrato de backend inventado.
- [ ] Configuração de ambiente segue a estratégia oficial já definida em
      CARSHOP-99.
- [ ] Build, lint, typecheck e testes relevantes passam.
- [ ] README/documentação atualizados.

## Riscos / bloqueios potenciais

- Decisão pendente sobre runner de testes (Vitest vs alternativa) —
  impacta configuração e scripts; requer decisão do `architect`/usuário
  antes do `developer` iniciar.
- Compatibilidade Shadcn/UI com Next.js 16 / React 19 ainda não
  confirmada contra a documentação oficial atual.
- Escopo amplo (múltiplas bibliotecas, múltiplas áreas: Public UI, Admin
  UI, Infra, Quality) aumenta risco de providers/configurações
  conflitantes entre si (ex. ordem de providers, CSS global do Tailwind
  vs Shadcn/UI, boundaries de Client Components para Framer Motion e RHF).
- Necessidade de decidir onde/como o provider do TanStack Query e o
  módulo Axios se relacionam com o módulo de acesso à API já criado em
  CARSHOP-99 (evitar duplicação de infraestrutura HTTP).

## Classificação de tamanho

**NON-TRIVIAL.**

Justificativa: múltiplas bibliotecas novas afetando múltiplas áreas
(Public UI, Admin UI, Infra, Quality), decisões arquiteturais em aberto
(runner de testes, posicionamento de providers, boundaries
Server/Client Components, compatibilidade Shadcn/UI com versões recentes
de Next/React), e alto risco de efeitos colaterais cruzados entre
configurações (Tailwind, Shadcn/UI, TanStack Query, testes). Plano via
`plan-writer` é obrigatório.

## Próximos agentes necessários

1. `knowledge-reader` — consultar Obsidian (`CarShop/Architecture`,
   `CarShop/ADRs`, `CarShop/Studies`) por decisões prévias sobre stack de
   testes, estrutura de providers, ou padrões já adotados relevantes a
   esta task.
2. `architect` — decidir (a) runner de testes final, (b) estrutura de
   Server vs Client Components para os novos providers (TanStack Query,
   RHF, Framer Motion), (c) organização de pastas para componentes
   Shadcn/UI e infraestrutura Axios, respeitando
   [docs/rules/rendering.md](../../docs/rules/rendering.md).
3. `plan-writer` — obrigatório dado o tamanho NON-TRIVIAL; persistir
   `plan.md` com sequenciamento de instalação/configuração por
   biblioteca e ordem de dependências entre elas.

## Sinalização ao usuário

Antes de prosseguir para `plan-writer`/`developer`, confirmar com o
usuário: (1) manter Vitest como runner de testes (com justificativa
documentada) ou migrar para outro runner; (2) ciência de que a
compatibilidade Shadcn/UI com Next.js 16.3.4/React 19.2.0 precisa ser
validada contra a documentação oficial no momento do setup, podendo gerar
um bloqueio técnico não previsto no DoD.
