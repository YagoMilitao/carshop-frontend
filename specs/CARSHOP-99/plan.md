# Plano de implementação — CARSHOP-99

Fonte: `specs/CARSHOP-99/spec.md` (NON-TRIVIAL). Decisões estruturais abaixo
são do `architect`; este plano não introduz nenhuma decisão arquitetural
nova, apenas ordena a execução.

## Bloqueio a confirmar com o usuário antes de prosseguir

A spec sinaliza um conflito de documentação (BLOQUEANTE apenas para o
subtópico de doc, não para a task em si): `CLAUDE.md` e
`docs/rules/nextjs.md` descrevem o app como "ainda em Vite + React Router",
mas o código já está 100% migrado para Next.js App Router (`next@^16`, sem
`vite`/`react-router`, `app/` com route groups `(admin)`/`(public)`).

- **Ação nesta task**: nenhuma. O `developer` **não deve tocar** em
  `CLAUDE.md` nem em `docs/rules/nextjs.md` quanto ao status da migração —
  isso é escopo de uma task/ADR separada, já sinalizada ao usuário.
- Se, durante a implementação, qualquer novo indício sugerir que essa
  desatualização afeta decisões desta task, parar e confirmar com o usuário
  antes de continuar (não decidir por conta própria).

Confirmar explicitamente com o usuário antes do `developer` iniciar:
adicionar `zod` e `server-only` como dependências novas ao `package.json`
(hoje não instaladas — ver spec, seção "Dependência a confirmar").

## Ordem de implementação

### 1. Corrigir versionamento do `.env` (achado de segurança)

- Editar `.gitignore` (raiz do projeto) adicionando:
  - `.env`
  - `.env*.local`
  - Manter `.env.example` fora do ignore (não usar padrão que o capture,
    ex. não usar `.env*` genérico).
- Rodar `git rm --cached .env` para destrackear o arquivo **sem apagá-lo**
  do disco (o `.env` local do desenvolvedor continua intacto e funcional).
- Não reescrever histórico do git — fora de escopo, já sinalizado ao
  usuário separadamente. O valor de `OBSIDIAN_VAULT_ID` já commitado
  permanece no histórico; isso é aceitável pois não é credencial (ver
  spec).
- Não reproduzir nenhum valor real de `.env` em commits, specs ou logs
  desta task (ver `docs/rules/spec-security.md`).

### 2. Adicionar dependências novas

- `package.json`: adicionar `zod` (dependencies) e `server-only`
  (dependencies — é usado em runtime/build para bloquear import
  client-side, não é dev-only).
- Rodar o instalador do pacote (npm, conforme scripts existentes usam
  `npm run`) para atualizar o lockfile.

### 3. Criar o módulo `lib/env/`

Estrutura nova na raiz do projeto, sibling de `app/` (decisão do
`architect`):

- `lib/env/client.ts`:
  - Define um schema Zod contendo apenas `NEXT_PUBLIC_API_URL:
    z.string().url()`.
  - Faz o parse de `process.env` contra esse schema no top-level do
    módulo (fail-fast: erro de validação lança/falha na primeira
    importação, em build e em runtime, não fica silencioso).
  - Exporta `clientEnv` (objeto validado e tipado, sem `any`).
- `lib/env/server.ts`:
  - `import "server-only"` como primeira linha do arquivo (garante erro de
    build se importado de um Client Component).
  - Define um schema Zod vazio hoje (placeholder pronto para vars
    server-only futuras, sem inventar variáveis que não existem ainda).
  - Exporta `serverEnv` com um campo `apiUrl` que reexporta
    `clientEnv.NEXT_PUBLIC_API_URL` (não duplica leitura de
    `process.env`; reaproveita o valor já validado em `client.ts`).
- Regra de uso a documentar em comentário no próprio módulo (ou no
  README/docs, passo 5): nenhum outro arquivo do projeto deve ler
  `process.env.NEXT_PUBLIC_API_URL` diretamente fora desses dois arquivos.
  Server Components, Route Handlers e services (futuros) usam `serverEnv`;
  Client Components e hooks (futuros) usam `clientEnv`.
- Não criar hoje nenhum consumidor desses módulos além do que já existe em
  `app/` (não há services/hooks de API implementados ainda — ver spec,
  "Escopo técnico"). O módulo deve apenas existir pronto para uso futuro.

### 4. Atualizar `.env.example`

- Manter `NEXT_PUBLIC_API_URL=http://localhost:3333` com valor de exemplo
  local (não real).
- Expandir/revisar comentários para deixar explícito:
  - Variáveis com prefixo `NEXT_PUBLIC_` são expostas ao bundle do
    navegador — nunca devem conter segredos/credenciais.
  - Variáveis server-only (ex. `OBSIDIAN_VAULT_ID`, já presente) **não**
    devem levar o prefixo `NEXT_PUBLIC_`, e futuras variáveis server-only
    devem seguir o mesmo padrão.
- Não adicionar variáveis novas que não existem hoje no projeto real —
  apenas os comentários explicativos pedidos pela spec/architect.

### 5. Atualizar documentação

- `README.md`: atualizar (ou criar, se não existir) uma seção curta de
  setup de `.env`, cobrindo: copiar `.env.example` para `.env`, convenção
  `NEXT_PUBLIC_` (client) vs. server-only, e apontar que o acesso a env em
  código deve passar por `lib/env/client.ts` / `lib/env/server.ts` (nunca
  `process.env` direto fora desses dois arquivos).
- `docs/rules/api.md`: expandir a linha existente sobre `.env.example`
  ("Variáveis de ambiente de API ficam em `.env.example`, nunca com
  valores reais commitados") para citar explicitamente a convenção
  `NEXT_PUBLIC_` vs. server-only e apontar para `lib/env/` como o único
  ponto de leitura de env permitido no projeto.
- Não tocar em `CLAUDE.md` nem `docs/rules/nextjs.md` (ver bloqueio acima).
- Nenhum valor real de `.env` em nenhum desses documentos (ver
  `docs/rules/spec-security.md`).

### 6. Validação final

Rodar, nesta ordem, e confirmar que todos passam antes de considerar a task
pronta para `tester`/`reviewer`:

1. `npm run build`
2. `npm run lint`
3. `npm run typecheck`

Se qualquer um falhar por causa do novo módulo `lib/env/` (ex. tipo
implícito, import de `server-only` em client boundary incorreto), corrigir
antes de prosseguir — não fazer bypass (`@ts-ignore`/`eslint-disable`
generalizado é proibido pelas regras do projeto).

## Critérios de aceite (resumo do DoD — mapeamento completo na spec)

Para `tester`/`reviewer` conferirem após a implementação:

- [ ] `.env.example` compatível com Next.js, comentários claros
      `NEXT_PUBLIC_` vs. server-only, sem valores reais.
- [ ] Nenhuma ocorrência de `VITE_API_URL`/`import.meta.env` no código
      (já satisfeito hoje; não reintroduzir).
- [ ] Única variável pública é `NEXT_PUBLIC_API_URL`, sem credenciais.
- [ ] Variáveis server-only (`OBSIDIAN_VAULT_ID` e futuras) não usam
      `NEXT_PUBLIC_`.
- [ ] Nenhuma credencial exposta ao bundle cliente (revisão de
      `lib/env/client.ts` e `.env.example`).
- [ ] Nenhum arquivo fora de `lib/env/client.ts` e `lib/env/server.ts` lê
      `process.env.NEXT_PUBLIC_API_URL` diretamente.
- [ ] Estratégia server vs. browser explícita via `serverEnv`/`clientEnv`.
- [ ] Config ausente/inválida falha de forma previsível (erro claro,
      fail-fast via Zod, top-level parse) — não falha silenciosamente.
- [ ] Tipagem estrita, sem `any`, validação de formato de URL via Zod.
- [ ] `.env` real fora do versionamento (`.gitignore` corrigido + `git rm
      --cached .env` executado; arquivo local preservado).
- [ ] `npm run build`, `npm run lint`, `npm run typecheck` passam.
- [ ] `README.md` e `docs/rules/api.md` atualizados conforme passo 5;
      `CLAUDE.md`/`docs/rules/nextjs.md` intocados nesta task.
