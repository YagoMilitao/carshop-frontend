# Contexto de Conhecimento no Obsidian

Este documento define como os agentes deste repositório devem consultar (e
nunca escrever automaticamente) a base de conhecimento pessoal do CarShop
mantida em Obsidian.

## Natureza da integração

- O Obsidian **não** é acessado via API proprietária. O vault é composto por
  arquivos Markdown locais — a integração é feita lendo esses arquivos
  diretamente do sistema de arquivos ou de uma pasta sincronizada com o
  workspace, quando disponível no ambiente.
- Se nenhum vault ou pasta sincronizada estiver disponível no ambiente atual,
  o agente deve avisar o usuário explicitamente e seguir sem consultar o
  Obsidian, em vez de assumir ou inventar conteúdo do vault.

## Estrutura do vault

Dentro do vault pessoal, o conhecimento do CarShop deve ficar isolado em uma
pasta dedicada, com a seguinte convenção de subpastas:

- `CarShop/Architecture` — decisões e diagramas de arquitetura vigentes.
- `CarShop/ADRs` — Architecture Decision Records (uma decisão por arquivo,
  com contexto, alternativas consideradas e consequência).
- `CarShop/Studies` — notas de estudo, comparações de bibliotecas, POCs e
  aprendizados que ainda não viraram decisão.
- `CarShop/Decisions` — decisões de produto/processo que não são
  estritamente arquiteturais (ex.: convenções de branch, fluxo de review).

## Precedência de fontes

Ao reconciliar informação conflitante entre fontes, os agentes devem seguir
esta ordem (da mais autoritativa para a menos autoritativa):

1. **Código atual** do repositório — é a fonte de verdade do que está de
   fato implementado.
2. **Decisões arquiteturais aprovadas** (`CarShop/Architecture`,
   `CarShop/ADRs` no Obsidian).
3. **Task atual do Notion** (Task Tracker) — ver
   [docs/context/notion.md](./notion.md).
4. **Notas de estudo do Obsidian** (`CarShop/Studies`) — material
   exploratório, não vinculante até virar ADR ou decisão.

Ou seja: o Obsidian complementa o Notion e o repositório, mas nunca os
substitui — notas de estudo em particular são a fonte menos autoritativa e
não devem guiar implementação sozinhas.

## Regras de leitura

- Ler o vault é opcional e só deve ocorrer quando a task em questão
  claramente se beneficia de contexto histórico/arquitetural (ex.: dúvida
  sobre uma decisão já tomada, ADR relevante para a área tocada).
- Nunca duplicar conteúdo do vault nos arquivos do repositório
  (`AGENTS.md`, `docs/`, etc.) — apenas referenciar o caminho/nome da nota
  quando relevante, como já é feito para o Notion.

## Regras de escrita

- Agentes **não devem escrever ou editar arquivos do vault** como efeito
  colateral de uma implementação. Qualquer nova nota, ADR ou estudo só deve
  ser criado a pedido explícito do usuário.
- **Nunca armazenar segredos, tokens, senhas ou conteúdo de `.env`** no
  vault, em nenhuma nota.
- Caminhos locais do vault (ou de uma pasta sincronizada dentro deste
  repositório) devem ser adicionados ao `.gitignore` sempre que existirem
  neste diretório de trabalho, para evitar commit acidental de conteúdo
  pessoal/privado.

## Resumo rápido (checklist do agente)

- [ ] Confirmado se há vault/pasta sincronizada disponível no ambiente antes
      de tentar ler
- [ ] Precedência respeitada: código > decisões aprovadas > task do Notion >
      notas de estudo do Obsidian
- [ ] Nenhuma escrita no vault sem pedido explícito do usuário
- [ ] Nenhum segredo, token, senha ou `.env` referenciado ou copiado para o
      vault
- [ ] Caminhos locais do vault no `.gitignore`, quando aplicável
