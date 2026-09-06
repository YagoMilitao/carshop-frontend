# Regra: API

- Backend Swagger/código é a fonte de verdade dos contratos de API — não
  inventar campos/endpoints que não existem no backend.
- **Axios** é a infraestrutura de HTTP client oficial-alvo para chamadas
  client-side, quando apropriado — não é uma obrigação para toda chamada
  server-side (Server Components/Route Handlers podem usar `fetch` nativo).
- Tipos de request/response são explícitos, sem `any` (ver
  [docs/rules/typescript.md](./typescript.md)).
- Tratamento de erro cobre o caminho não-feliz: falha de rede, erro do
  backend, autenticação expirada — não apenas o caminho feliz.
- Repositório não duplica endpoints do backend Express como Next Route
  Handlers sem necessidade explícita (ver
  [docs/rules/nextjs.md](./nextjs.md)).
- Variáveis de ambiente de API ficam em `.env.example`, nunca com valores
  reais commitados. Variáveis expostas ao bundle do navegador usam o
  prefixo `NEXT_PUBLIC_` (ex.: `NEXT_PUBLIC_API_URL`) e nunca contêm
  segredos/credenciais; variáveis server-only não usam esse prefixo.
  `lib/env/client.ts` (`clientEnv`) e `lib/env/server.ts` (`serverEnv`) são
  o único ponto de leitura/validação de env do projeto — nenhum outro
  arquivo deve ler `process.env.NEXT_PUBLIC_API_URL` diretamente.
