# Regra: Next.js (App Router)

- App Router é o roteamento oficial-alvo (não Pages Router, não React
  Router) para qualquer rota nova planejada dentro dessa arquitetura.
- Só se aplica de fato depois que o projeto tiver a dependência `next`
  instalada no `package.json`. Enquanto isso não acontece, tratar como
  decisão de arquitetura documentada, não como implementação em curso.
- Convenções de arquivos do App Router (`page.tsx`, `layout.tsx`,
  `loading.tsx`, `error.tsx`, `not-found.tsx`, route groups) são a base para
  organizar rotas quando a migração ocorrer.
- Não duplicar endpoints do backend Express como Next Route Handlers sem
  necessidade explícita — o backend continua sendo a fonte dos contratos de
  API (ver [docs/rules/api.md](./api.md)).
- Metadata/SEO usam a API de metadata do App Router quando aplicável (ver
  [docs/rules/seo.md](./seo.md)).
