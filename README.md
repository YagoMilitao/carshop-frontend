# CarShop Frontend (Next.js + React + TypeScript)

Frontend do projeto CarShop (tapeçaria automotiva). Exibe trabalhos,
detalhes e comentários. Inclui área admin (futuro) para gerenciar trabalhos
e uploads.

## Stack

- **Next.js (App Router)** + React 19 + TypeScript estrito.
- **TailwindCSS v4** (CSS-first, via `@tailwindcss/postcss`) — diretiva
  `@import "tailwindcss"` em `app/globals.css`, sem `tailwind.config.ts`
  (não é mais necessário no modelo CSS-first do Tailwind v4).
- **Shadcn/UI** (CLI `shadcn`, base Radix UI, preset `nova`) — primitivos
  gerados em `components/ui/` (ex.: `Button`), configurados via
  `components.json` na raiz (aliases `@/components`, `@/lib`). Usa o
  pacote `cn` oficial do shadcn (substituto compilado de
  `clsx` + `tailwind-merge`) e o meta-pacote `radix-ui`. Os componentes
  gerados usam `lucide-react` internamente — essa dependência fica restrita
  a `components/ui/*`; código de aplicação usa **React Icons**.
- **TanStack Query** — provider único em `app/providers.tsx`
  (`"use client"`, `QueryClient` via `useState`), montado em
  `app/layout.tsx` (que permanece Server Component).
- **Axios** — instância única e centralizada em `lib/api/http.ts`
  (`baseURL` a partir de `clientEnv.NEXT_PUBLIC_API_URL`); nenhuma feature
  deve instanciar Axios separadamente ou usar `fetch` para chamadas
  client-side equivalentes (Server Components continuam livres para usar
  `fetch` nativo do Next).
- **React Hook Form + Zod** (`@hookform/resolvers` para `zodResolver`) —
  padrão `useForm<FormValues>({ resolver: zodResolver(schema) })` em
  Client Components; schemas compartilhados ficam em `schemas/<domain>.ts`.
- **Framer Motion** — instalado; uso restrito a `"use client"` no menor
  componente que efetivamente anima, nunca em layouts.
- **React Icons** — padrão de iconografia em código de aplicação (fora de
  `components/ui/*`).
- Backend Node/Express independente (serviço externo, consumido via API —
  sem Route Handlers duplicando contratos existentes).

`react-router-dom` não é instalado nem utilizado — roteamento é feito pelo
App Router do Next.js.

## Pré-requisitos

- Node.js LTS (18+ recomendado)
- npm

## Como rodar localmente

### 1) Instalar dependências

```bash
npm install
```

### 2) Configurar variáveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores conforme seu ambiente:

```bash
cp .env.example .env
```

Convenção de variáveis (Next.js):

- Prefixo `NEXT_PUBLIC_` (ex.: `NEXT_PUBLIC_API_URL`): exposta ao bundle do
  navegador (client-side). Nunca deve conter segredos/credenciais.
- Sem prefixo `NEXT_PUBLIC_` (ex.: `OBSIDIAN_VAULT_ID`): server-only, nunca
  vai para o bundle cliente.

O acesso a variáveis de ambiente em código deve sempre passar por
`lib/env/client.ts` (`clientEnv`, para uso client-side) ou
`lib/env/server.ts` (`serverEnv`, para Server Components, Route Handlers e
services). Nenhum outro arquivo do projeto deve ler
`process.env.NEXT_PUBLIC_API_URL` diretamente — os módulos de `lib/env/`
validam a presença/formato das variáveis via Zod e falham de forma
previsível (erro claro em build/runtime) quando ausentes ou inválidas.

`.env` real nunca é commitado (está no `.gitignore`); apenas `.env.example`
é versionado.

### 3) Rodar em modo desenvolvimento

```bash
npm run dev
```

A aplicação sobe por padrão em `http://localhost:3000`.

### 4) Build de produção

```bash
npm run build
npm run start
```

### 5) Lint e typecheck

```bash
npm run lint
npm run typecheck
```

### 6) Testes

```bash
npm run test
npm run test:watch
npm run test:coverage
```

Runner: Vitest + Testing Library (`vitest.config.ts`, `vitest.setup.ts`).
`next/font/google` é mockado em `test/mocks/next-font-google.ts` (via alias
no `vitest.config.ts`), já que o loader real de fontes do Next depende do
build do framework e não está disponível em ambiente Vitest/jsdom.

## Estrutura de rotas (`app/`)

- `app/layout.tsx` — layout raiz (Server Component).
- `app/(public)/` — grupo de rotas públicas (Server Components); inclui a
  Home (`/`) como placeholder mínimo.
- `app/(admin)/admin/` — grupo de rotas da área administrativa (`/admin`),
  também como placeholder mínimo (Server Component).
- `app/not-found.tsx` — página 404.
- `app/error.tsx` — error boundary (única exceção obrigatória do framework
  para uso de `'use client'` neste esqueleto).

Nenhuma feature de negócio (Home real, Services, Portfolio, Project
Details, autenticação admin) está implementada ainda — apenas o esqueleto
mínimo de rotas/layout.

## Estrutura de pastas (stack complementar)

- `components/ui/` — primitivos gerados pelo Shadcn/UI (não editar
  manualmente; usar `npx shadcn add <componente>`).
- `components/` — componentes compostos reutilizados entre rotas.
- `app/(public)/_components/`, `app/(admin)/admin/<feature>/_components/` —
  componentes específicos de uma única rota/feature.
- `lib/utils.ts` — `cn()` (Shadcn/UI, pacote `cn`).
- `lib/api/http.ts` — instância única do Axios; `lib/api/<recurso>.ts` para
  módulos por recurso, criados apenas quando houver consumo real.
- `lib/env/` — acesso único e validado (Zod) a variáveis de ambiente
  (`clientEnv`/`serverEnv`), ver `CARSHOP-99`.
- `app/providers.tsx` — Client Component único com `QueryClientProvider`.
- `schemas/<domain>.ts` — schemas Zod compartilhados entre formulários
  (schema de uso único fica junto do componente do formulário).
