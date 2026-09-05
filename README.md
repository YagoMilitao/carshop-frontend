# CarShop Frontend (Next.js + React + TypeScript)

Frontend do projeto CarShop (tapeçaria automotiva). Exibe trabalhos,
detalhes e comentários. Inclui área admin (futuro) para gerenciar trabalhos
e uploads.

## Stack

- **Next.js (App Router)** + React 19 + TypeScript estrito.
- Backend Node/Express independente (serviço externo, consumido via API —
  sem Route Handlers duplicando contratos existentes).

Pendência conhecida (fora do escopo da migração `CARSHOP-113`, registrada
para tasks futuras — ver `docs/rules/`): TailwindCSS, Shadcn/UI, TanStack
Query, Axios, React Hook Form, Zod, Framer Motion e React Icons ainda
**não** estão instalados. Não assumir nenhuma dependência da stack alvo
como instalada sem conferir `package.json`.

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

Copie `.env.example` para `.env` e ajuste os valores conforme seu ambiente
(apenas variáveis `NEXT_PUBLIC_*` são expostas ao cliente; nunca commitar
valores reais de `.env`):

```bash
cp .env.example .env
```

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
