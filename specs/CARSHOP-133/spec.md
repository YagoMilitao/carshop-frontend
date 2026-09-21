# CARSHOP-133 — Adicionar links reais de redes sociais no footer

## Origem

Task no Notion: `CARSHOP-133` (Component: Public UI, Priority: Low, Sprint 6,
Epic: Frontend Público). Descrição/DoD completos no Notion — não duplicados
aqui. Ver também `CARSHOP-22` (implementação original removida em code
review por apontar para homepages genéricas das plataformas em vez de
perfis reais da CarShop).

## Decisão de escopo do usuário (restringe esta implementação)

O usuário ainda não possui as URLs reais dos perfis (Instagram/Facebook/
LinkedIn). Ele decidiu explicitamente que esta task **não** vai hardcodear
URLs (reais nem placeholder) — em vez disso:

- As URLs serão parametrizadas via variáveis de ambiente.
- O footer renderiza cada link de rede social **somente se** a variável de
  ambiente correspondente estiver definida (ausência da env var = link
  omitido, não um `href` inventado ou vazio).
- `.env.example` documenta os nomes das variáveis, sem valores reais
  (conforme `docs/rules/spec-security.md`).

Isso significa que o DoD original ("footer exibe links apontando para
perfis reais/ativos") só será cumprido visualmente quando o usuário
preencher as env vars em seu próprio ambiente; esta task entrega a
infraestrutura (env vars + renderização condicional + testes), não os
perfis reais em si. Este ponto já foi validado com o usuário e não é
um conflito em aberto.

## Estado atual do repositório (lido antes da spec)

- `components/layout/footer.tsx`: Server Component (sem `"use client"`),
  sem estado/interatividade. Hoje só renderiza copyright + nav
  "Links institucionais" (`navLinks`). A seção de redes sociais foi
  removida.
- `components/layout/footer.test.tsx`: contém um teste que **afirma
  explicitamente que não deve haver links de redes sociais**
  (`"não renderiza dados de negócio inventados... redes sociais"`,
  linha 33-41). Esse teste precisa ser atualizado/substituído para
  refletir o novo comportamento condicional — caso contrário ele vai
  falhar quando os links passarem a existir (mesmo que ausentes por
  padrão em ambiente de teste sem as env vars).
- `.env.example` documenta `NEXT_PUBLIC_*` (expostas ao bundle client,
  validadas em `lib/env/client.ts`) e variáveis server-only sem prefixo
  (validadas em `lib/env/server.ts`, hoje com schema vazio como
  placeholder). Padrão do projeto: nenhum arquivo lê `process.env.*`
  diretamente fora desses dois módulos — tudo passa por `clientEnv`/
  `serverEnv` com validação Zod "fail fast".

## Decisão técnica desta spec (não arquitetural, decorre do estado atual)

Como `Footer` é e continua sendo Server Component, e essas URLs não são
segredos mas também não precisam estar no bundle do cliente (não há
interatividade client-side envolvida), as variáveis devem ser **server-only**
(sem prefixo `NEXT_PUBLIC_`), lidas via `lib/env/server.ts`, e não em
`lib/env/client.ts`. Isso segue a convenção de nomenclatura já documentada
no `.env.example` e evita expor no bundle do navegador uma informação que
não precisa estar lá.

Nomes propostos (mesmas 3 redes que existiam antes, mesma ordem):

- `SOCIAL_INSTAGRAM_URL`
- `SOCIAL_FACEBOOK_URL`
- `SOCIAL_LINKEDIN_URL`

Diferença em relação ao padrão atual de `serverEnvSchema`/`clientEnvSchema`
(hoje todos os campos são obrigatórios, `.parse` falha rápido se ausente):
estes 3 campos devem ser **opcionais**, já que o requisito é "renderiza
somente se definida". Antes de validar a URL, o schema deve normalizar a
string vazia (`""`) para `undefined`, pois esse é o valor produzido quando a
variável documentada sem valor na `.env.example` é copiada para um arquivo de
ambiente. Valores não vazios continuam sujeitos à validação de URL e devem
falhar rápido se forem inválidos.

## Escopo (arquivos afetados)

- `components/layout/footer.tsx` — reintroduzir `<nav aria-label="Redes
  sociais">` com os mesmos atributos de acessibilidade usados antes
  (`target="_blank"`, `rel="noreferrer"`), renderizando cada link
  condicionalmente a partir de `serverEnv`.
- `components/layout/footer.test.tsx` — atualizar/restaurar cobertura:
  - remover/ajustar o teste que afirma ausência categórica de links de
    redes sociais;
  - cobrir o caso "todas as env vars definidas" (3 links renderizados,
    com `href`, `target="_blank"`, `rel="noreferrer"` corretos, dentro de
    `nav[aria-label="Redes sociais"]`);
  - cobrir o caso "env vars ausentes" (nenhum link de rede social
    renderizado, nav de redes sociais ausente ou vazio conforme
    implementação escolhida pelo developer);
  - isso implica mockar/stubar `serverEnv` (ou `process.env`) no teste,
    seguindo o padrão já usado em `lib/env/server.test.ts` /
    `lib/env/client.test.ts`, se aplicável.
- `lib/env/server.ts` — adicionar os 3 campos opcionais ao
  `serverEnvSchema`, normalizando `""` para `undefined` antes da validação de
  URL, e expor no objeto `serverEnv` exportado (ex.:
  `serverEnv.social.instagramUrl`, etc., ou nomes equivalentes definidos
  pelo developer respeitando `docs/rules/typescript.md`).
- `lib/env/server.test.ts` — cobrir a regressão em que as três variáveis
  existem com valor `""`: a importação de `serverEnv` não lança erro e os
  campos correspondentes são expostos como `undefined`. Preservar a cobertura
  de URLs válidas e da ausência das variáveis.
- `.env.example` — adicionar as 3 novas variáveis com comentário
  explicativo, sem valores reais (vazias ou com placeholder claramente
  não-funcional), seguindo o padrão de comentários já usado no arquivo.

Nenhuma rota, componente de layout adicional, ou decisão de Server/Client
Component muda — `Footer` permanece Server Component.

## Fora de escopo

- Preencher as URLs reais dos perfis (responsabilidade do usuário, fora
  desta task).
- Qualquer outra rede social além de Instagram/Facebook/LinkedIn.
- Alterações em `lib/env/client.ts` (não se aplica — variáveis são
  server-only).

## DoD (adaptado ao escopo combinado com o usuário)

- Footer renderiza nav "Redes sociais" com os mesmos padrões de
  acessibilidade anteriores, com links lidos de env vars server-only.
- Cada link só aparece se a env var correspondente estiver definida e
  não vazia; `""` é normalizado para `undefined` antes da validação de URL.
- `.env.example` documenta as 3 novas variáveis sem valores reais.
- `footer.test.tsx` cobre: renderização com todas as vars definidas,
  renderização com vars ausentes, e atributos de acessibilidade
  (`aria-label`, `target`, `rel`).
- `lib/env/server.test.ts` cobre explicitamente as três `SOCIAL_*_URL` com
  valor `""`, garantindo que `serverEnv` seja importado sem `ZodError` e que
  os valores normalizados sejam `undefined`.
- Nenhum `any`/`as any`/cast inseguro introduzido (TypeScript estrito).

## Classificação de tamanho

**SMALL** — escopo limitado a 5 arquivos já identificados
(`footer.tsx`, `footer.test.tsx`, `lib/env/server.ts`,
`lib/env/server.test.ts`, `.env.example`),
sem mudança de rota, sem decisão de Server/Client Component (Footer
permanece Server Component) e sem novo componente estrutural. A única
decisão técnica não trivial (nomenclatura server-only das env vars e
extensão do schema Zod para campos opcionais) já foi resolvida nesta
spec com base no padrão existente em `lib/env/server.ts`/`client.ts`,
não exigindo uma decisão arquitetural nova.

O follow-up deste review é **TRIVIAL**: altera somente a normalização pontual
das três entradas em `lib/env/server.ts` e adiciona um teste de regressão em
`lib/env/server.test.ts`, sem ampliar o comportamento público nem introduzir
decisão arquitetural.

## Agentes seguintes necessários

- `knowledge-reader`: não necessário — não há conhecimento histórico
  arquitetural relevante além do já referenciado (`CARSHOP-22`, já
  descrito acima).
- `architect`: não necessário — não há decisão de estrutura/rota/
  Server-Client em aberto; Footer permanece Server Component e a
  extensão do schema de env é uma decisão técnica pontual já registrada
  nesta spec.
- `plan-writer`: opcional para a task completa (SMALL) e desnecessário para
  este follow-up (TRIVIAL). O fluxo pode seguir direto para `developer`, dado
  que a correção está delimitada nesta spec.
