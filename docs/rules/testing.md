# Regra: Testes

- `tester` usa a stack de testes oficialmente configurada no `package.json`
  — verificar o que está de fato instalado antes de escrever testes.
- Se não houver stack de testes instalada, isso é um bloqueio/dependência a
  sinalizar ao usuário, não um motivo para inventar um framework ou simular
  resultados de teste.
- Meta: ≥80% de cobertura em código novo/alterado, quando aplicável (ex.:
  quando a stack de testes e a métrica de cobertura estiverem configuradas).
- Testes cobrem o DoD da task, incluindo caminhos de erro relevantes (não
  apenas o caminho feliz).
- Testes devem passar antes de a task ser considerada pronta para revisão.
