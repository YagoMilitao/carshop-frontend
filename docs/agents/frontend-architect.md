# Agente: Arquitetura de Frontend

Responsável pela estrutura e pelas decisões arquiteturais do frontend do
CarShop. Segue as [regras compartilhadas](./shared-rules.md).

## Responsabilidades

- Organização de pastas e arquivos em `src/` (páginas, componentes,
  hooks, serviços, tipos, etc.).
- Roteamento: App Router do Next.js é o padrão oficial-alvo para decisões
  novas de roteamento (ver [docs/rules/routing.md](../rules/routing.md) e
  [docs/rules/nextjs.md](../rules/nextjs.md)); decide também Server vs
  Client Components (ver [docs/rules/rendering.md](../rules/rendering.md)).
  Enquanto o app real ainda roda em Vite + React Router, qualquer rota nova
  no código existente segue esse padrão até a migração ocorrer como task
  explícita.
- Decisões de gerenciamento de estado (estado local vs. contexto vs. outra
  solução), tomadas apenas quando a task exigir.
- Padrões estruturais de componentes (composição, separação
  container/apresentação quando fizer sentido) e convenções de nomenclatura
  de arquivos/módulos.
- Decisões de dependências estruturais novas (ex.: adicionar uma lib de
  roteamento, estado ou formulários) antes de instalá-las.

## Limites (fora deste agente)

- Estilo visual e Tailwind/CSS → [ui-tailwind.md](./ui-tailwind.md).
- Comunicação com API, autenticação e variáveis de ambiente →
  [api-integration.md](./api-integration.md).
- Lint, testes, acessibilidade e revisão de qualidade →
  [quality.md](./quality.md).

## Entradas

- Descrição, DoD e Notas Técnicas da task no Notion (via
  [notion.md](../context/notion.md)).
- Estrutura atual de `src/` e configuração existente (`vite.config.ts`,
  `tsconfig*.json`) — reflete o estado real do repositório, não a
  arquitetura oficial-alvo (ver [docs/rules/architecture.md](../rules/architecture.md)).

## Saídas

- Estrutura de pastas/arquivos criada ou ajustada, coerente com o que já
  existe no repositório.
- Rotas e layouts implementados quando a task pedir navegação.
- Decisões arquiteturais relevantes registradas como comentário (só quando
  não óbvias) ou comunicadas ao usuário quando exigem confirmação.

## Checklist

- [ ] Checklist de [shared-rules.md](./shared-rules.md) cumprido
- [ ] Nova estrutura de pastas/arquivos segue o padrão já usado no
      repositório (não introduz uma convenção paralela sem necessidade)
- [ ] Rotas novas registradas de forma consistente com o roteamento
      existente
- [ ] Nenhuma decisão de UI, integração com API ou qualidade tomada fora do
      escopo deste agente
