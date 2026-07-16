# SonarCloud Quality Gate

Este repositório já fica pronto para rodar análise no CI via GitHub Actions, mas a ativação do Quality Gate acontece no painel do SonarCloud.

## 1. Pré-requisitos no GitHub

Criar o secret:

- `SONAR_TOKEN`: token gerado no SonarCloud

Criar as repository variables:

- `SONAR_ORGANIZATION`: organização do SonarCloud
- `SONAR_PROJECT_KEY`: chave do projeto no SonarCloud

## 2. Ativar o gate no SonarCloud

No SonarCloud:

1. Abrir o projeto `carshop-frontend`
2. Ir em `Project Settings` -> `Quality Gate`
3. Escolher uma das opções:
   - `Sonar way`: bom se o time já estiver confortável com os thresholds padrão
   - Gate customizado inicial: recomendado para adoção gradual

## 3. Gate inicial recomendado

Se a base já tem dívida alta, vale começar protegendo apenas código novo. Um baseline realista:

- `New Bugs`: `0`
- `New Vulnerabilities`: `0`
- `New Maintainability Rating`: `A`
- `New Duplicated Lines (%)`: `<= 5%`

Cobertura:

- Fase 1: não bloquear merge por coverage enquanto a suíte ainda não existe ou é muito pequena
- Fase 2: exigir `Coverage on New Code >= 20%`
- Fase 3: subir gradualmente para `40%`, `60%` e depois o alvo final do time

Esse modelo impede entrada de bug/vulnerabilidade nova e evita aumentar dívida em código novo sem travar a evolução do legado.

## 4. New Code Definition

Para a estratégia funcionar bem:

1. Ir em `Project Settings` -> `New Code`
2. Configurar `Previous version` ou um período fixo do time

`Previous version` costuma funcionar melhor quando vocês versionam releases com frequência. Se ainda não houver disciplina de release, usar um período inicial também é aceitável.

## 5. Como o CI passa a funcionar

O workflow versionado neste repositório:

- instala dependências com `npm ci`
- executa `npm run lint`
- executa `npm run build`
- roda o scan do SonarCloud
- espera o resultado do `Quality Gate` antes de concluir o job

## 6. Observações

- O arquivo `sonar-project.properties` já aponta para `coverage/lcov.info`, então quando a cobertura for adicionada ao CI o SonarCloud passará a importá-la
- Enquanto não houver relatório de cobertura, o ideal é não colocar coverage como condição obrigatória no gate
- Se o projeto usar branch principal diferente de `main`, ajustar no workflow
