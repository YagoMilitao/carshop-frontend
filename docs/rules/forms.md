# Regra: Formulários

- **React Hook Form + Zod** são a stack oficial-alvo para formulários:
  RHF para estado/registro dos campos, Zod para schema de validação.
- Mensagens de erro de validação são claras e associadas ao campo
  correspondente (acessibilidade — ver
  [docs/rules/accessibility.md](./accessibility.md)).
- Schemas Zod são a fonte de tipos do formulário (`z.infer`) quando possível,
  evitando duplicar tipos manualmente.
- Só usar RHF/Zod depois que as dependências estiverem de fato instaladas no
  `package.json`; ausência é bloqueio, não motivo para código fictício.
