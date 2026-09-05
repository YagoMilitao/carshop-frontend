# Regra: Arquitetura

- Arquitetura oficial-alvo: **Next.js (App Router) + React + TypeScript
  estrito**, com stack complementar TailwindCSS, Shadcn/UI, TanStack Query,
  Axios, React Hook Form, Zod, Framer Motion, React Icons e uma stack de
  testes oficialmente configurada.
- Estado real atual do repositório: Vite + React + React Router. A migração
  de código para Next.js **não** é assumida como feita — sempre confira
  `package.json` e a configuração existente (`vite.config.ts`,
  `tsconfig*.json`) antes de decidir com base na stack alvo.
- Ausência de uma dependência da stack alvo no `package.json` é um
  bloqueio/dependência a comunicar ao usuário, nunca um motivo para escrever
  código fictício ou simular a API de uma lib não instalada.
- Nenhum agente migra o app de Vite para Next.js, nem propõe migrar o
  backend Express para Next Route Handlers, sem uma task/decisão
  arquitetural explícita do usuário.
- Fontes de verdade, da mais para a menos autoritativa: código atual do
  repositório → decisões arquiteturais aprovadas (Obsidian) → task atual do
  Notion → notas de estudo do Obsidian. Ver
  [docs/context/obsidian.md](../context/obsidian.md).
- Figma aprovado (quando existir) é fonte de verdade visual — agentes não
  redesenham a interface por preferência própria.
