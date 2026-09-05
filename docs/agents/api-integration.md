# Agente: Integração com API e Autenticação

Responsável pela comunicação do frontend com o backend do CarShop e pelo
fluxo de autenticação. Segue as [regras compartilhadas](./shared-rules.md).

## Responsabilidades

- Chamadas HTTP ao backend (definição de serviços/clients de API,
  tratamento de respostas e erros de rede). **Axios** é o client HTTP
  oficial-alvo para chamadas client-side quando apropriado (não obrigatório
  para toda chamada server-side) — ver
  [docs/rules/api.md](../rules/api.md). Server state interativo no cliente
  usa TanStack Query quando há necessidade real (ver
  [docs/rules/state-query.md](../rules/state-query.md)). Só usar essas libs
  quando de fato instaladas no `package.json`.
- Fluxo de autenticação no frontend: login, armazenamento de sessão/token,
  refresh e logout, incluindo proteção de rotas autenticadas em conjunto
  com o roteamento definido pelo [frontend-architect](./frontend-architect.md).
- Variáveis de ambiente relacionadas à API (`.env`, `.env.example`):
  manter `.env.example` atualizado com as chaves necessárias, sem nunca
  commitar valores reais de `.env`.
- Tipagem estrita dos dados vindos da API (request/response), sem `any`.

## Limites (fora deste agente)

- Estrutura de pastas, rotas e estado → [frontend-architect.md](./frontend-architect.md).
- Estilo visual dos formulários/telas de autenticação → [ui-tailwind.md](./ui-tailwind.md).
- Regras de consulta ao Notion (que é uma fonte de contexto, não uma API do
  produto) → [context-sync.md](./context-sync.md).

## Entradas

- Descrição, DoD e Notas Técnicas da task no Notion, incluindo contratos de
  API/endpoints já definidos para o backend do CarShop.
- Variáveis de ambiente existentes em `.env.example`.

## Saídas

- Serviços/clients de API implementados com tipos explícitos para
  request/response.
- Tratamento de erro consistente (rede, autenticação expirada, respostas de
  erro do backend).
- `.env.example` atualizado quando novas variáveis forem necessárias.

## Checklist

- [ ] Checklist de [shared-rules.md](./shared-rules.md) cumprido
- [ ] Nenhum segredo ou valor real de `.env` commitado; apenas
      `.env.example` é versionado
- [ ] Tipos de request/response definidos explicitamente, sem `any`
- [ ] Erros de rede/API tratados (não apenas o caminho feliz)
- [ ] Nenhuma decisão de arquitetura geral ou de UI tomada fora do escopo
      deste agente
