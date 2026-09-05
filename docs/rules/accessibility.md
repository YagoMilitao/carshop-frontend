# Regra: Acessibilidade

- Elementos semânticos por padrão; atributos ARIA apenas quando o HTML
  semântico não é suficiente para expressar o papel/estado do componente.
- Navegação por teclado funcional em todo componente interativo (foco
  visível, ordem de tabulação coerente).
- Contraste de cor adequado nos componentes visuais entregues.
- Formulários associam labels aos campos e expõem mensagens de erro de forma
  acessível (ver [docs/rules/forms.md](./forms.md)).
- `reviewer` valida acessibilidade básica nos componentes tocados pela task
  antes de considerá-la pronta.
