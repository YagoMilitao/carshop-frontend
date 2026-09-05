# CARSHOP-113 — Plano de implementação: migração Vite → Next.js App Router

Referência: `specs/CARSHOP-113/spec.md` (DoD completo no Task Tracker/Notion).
Este plano reflete a decisão do `architect` sobre estrutura, roteamento e
Server vs Client Components. Não introduz decisões arquiteturais novas.

## Ponto a confirmar com o usuário antes de iniciar (não bloqueante, mas sinalizado)

- Nenhuma dependência da stack alvo (Tailwind, Shadcn/UI, TanStack Query,
  Axios, React Hook Form, Zod, Framer Motion, React Icons) está instalada
  hoje em `package.json`. Esta task **não** instala nenhuma delas — apenas
  o Next.js em si e devDependencies estritamente necessárias ao build/lint.
  Ficam registradas como pendência conhecida (ver seção "Fora de escopo").
- A versão do Next.js a instalar deve ser confirmada como compatível com
  React 19 (já presente em `package.json`) antes de fixar a versão no
  `package.json`. Se houver incompatibilidade, isso é um bloqueio a
  reportar ao usuário antes de prosseguir com a instalação.

## Áreas/arquivos críticos a tocar

- `package.json` (dependencies, devDependencies, scripts)
- `tsconfig.json` (migração para formato único do Next)
- `eslint.config.js`
- Novo diretório `app/` (estrutura completa abaixo)
- `src/index.css` → conteúdo migrado para `app/globals.css`
- Remoção futura (fase final): `vite.config.ts`, `index.html`, `src/main.tsx`,
  `src/App.tsx`, `src/App.css`, `src/assets/react.svg`
- `README.md` (documentação de setup)

## Estrutura `app/` a criar (decisão do architect)

```
app/
  layout.tsx                 (Server Component — html/body, fontes, metadata base)
  globals.css                (substitui src/index.css)
  (public)/
    layout.tsx                (Server Component)
    page.tsx                  (Home placeholder mínimo, Server Component)
  (admin)/
    admin/
      layout.tsx              (Server Component placeholder)
      page.tsx                (placeholder mínimo)
  not-found.tsx               (Server Component)
  error.tsx                   (Client Component — única exceção obrigatória do framework)
```

Route groups `(public)` e `(admin)` não afetam a URL. Nenhuma página de
negócio (Services, Portfolio, Project Details, autenticação admin real) é
implementada nesta task — apenas o esqueleto mínimo para o build funcionar.

### Critério Server vs Client Components

- Server Component é o padrão em todo o esqueleto novo.
- `'use client'` só na menor boundary possível e só com justificativa
  técnica concreta.
- `error.tsx` é a única exceção obrigatória (exigência do framework).
- Área `(admin)` também começa como Server Component placeholder — não
  antecipar client-side sem feature real.

## Checklist sequencial de implementação (com gates de validação)

### Fase 1 — Setup Next.js convivendo com Vite

- [ ] 1. Instalar Next.js confirmando versão compatível com React 19; instalar
      devDependencies equivalentes necessárias (integração ESLint flat config
      compatível, mantendo `eslint-plugin-react-hooks`).
- [ ] 2. Criar a estrutura `app/` nova (conforme árvore acima) em paralelo,
      **sem apagar `src/` ainda**.
- [ ] 3. Migrar `tsconfig.json` para o formato único do Next
      (`moduleResolution: "bundler"`, `plugins: [{ "name": "next" }]`,
      `strict: true` mantido, sem `any` implícito).
- [ ] 4. Adaptar `eslint.config.js` para incluir regras do Next mantendo o
      que já existe; avaliar remoção de `eslint-plugin-react-refresh` (só
      remover se não houver equivalente necessário no ecossistema Next).
- [ ] 5. Registrar em `README.md`/plano a pendência conhecida: Tailwind,
      Shadcn/UI, TanStack Query, Axios, React Hook Form, Zod, Framer Motion e
      React Icons **não** são instalados nesta task.
- [ ] 6. Mover conteúdo reaproveitável: revisar `src/index.css` e portar
      reset/estilos necessários para `app/globals.css`; descartar
      `src/assets/react.svg` (lixo de template, sem valor de negócio).
- [ ] 7. Atualizar scripts do `package.json`:
      `dev` → `next dev`, `build` → `next build`, `lint` → `next lint`,
      `preview`/`start` → `next start`.

### Gate 1 — validação em convivência (Next novo + Vite antigo ainda presentes)

- [ ] Rodar build do Next (`next build`) e confirmar sucesso.
- [ ] Rodar lint (`next lint` / eslint) e confirmar sem erros novos.
- [ ] Rodar typecheck (`tsc --noEmit` conforme novo `tsconfig.json`) e
      confirmar sem erros.
- [ ] Confirmar que a aplicação Next serve corretamente em dev
      (`next dev`) exibindo os placeholders de `(public)` e `(admin)`.
- [ ] Só avançar para a Fase 2 se todos os itens acima passarem.

### Fase 2 — Remoção do Vite (somente após Gate 1 aprovado)

- [ ] 8. Remover `vite.config.ts`, `index.html`, `src/main.tsx`,
      `src/App.tsx`, `src/App.css`.
- [ ] 9. Remover dependências `vite` e `@vitejs/plugin-react` do
      `package.json` (dependencies/devDependencies).
- [ ] 10. Atualizar `README.md`/documentação de setup: stack oficial passa a
      ser Next.js App Router + backend Express independente (serviço
      externo, sem Route Handlers duplicando contratos); instruções de como
      rodar localmente (dev/build/lint/start via Next).

### Gate 2 — validação final (base sem Vite)

- [ ] Build (`next build`), lint (`next lint`) e typecheck (`tsc --noEmit`)
      passam na base final, sem Vite.
- [ ] Smoke test manual/local: app sobe com `next dev`/`next start` e as
      rotas placeholder (`/`, `/admin`, rota 404, cenário de erro) respondem
      corretamente.
- [ ] Nenhum `any`, `as any`, `@ts-ignore` ou `@ts-expect-error` introduzido.
- [ ] Nenhuma variável server-only exposta ao cliente; apenas
      `NEXT_PUBLIC_*` usadas em código client-side (conferir `.env.example`
      sem expor valores reais).
- [ ] `react-router-dom` continua não instalado (já satisfeito hoje; apenas
      confirmar que a migração não o reintroduz).

## Fora de escopo (explícito, não implementar nesta task)

- Migração do backend Express para Next Route Handlers.
- Criação de endpoints Next duplicando contratos existentes do backend.
- Implementação de features de negócio (Home, Services, Portfolio, Project
  Details, autenticação admin real) além do esqueleto mínimo de rotas/layout.
- Instalação de Tailwind, Shadcn/UI, TanStack Query, Axios, React Hook Form,
  Zod, Framer Motion ou React Icons — permanecem como pendência conhecida
  para tasks futuras, salvo indicação contrária explícita do usuário.

## Segurança

- Nenhum segredo ou valor real de `.env` deve constar em código, commits,
  README ou comentários introduzidos por esta migração — apenas nomes de
  variáveis (ex.: `NEXT_PUBLIC_API_URL`).
- Atenção ao limite Server/Client: nada que hoje seria server-only pode
  vazar para um Client Component via prop ou import direto.
