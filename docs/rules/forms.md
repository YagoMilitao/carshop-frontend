# Rule: Forms

- **React Hook Form + Zod** are the target-official stack for forms: RHF
  for field state/registration, Zod for validation schema.
- Validation error messages are clear and associated with the
  corresponding field (accessibility — see
  [docs/rules/accessibility.md](./accessibility.md)).
- Zod schemas are the form's source of types (`z.infer`) when possible,
  avoiding manually duplicating types.
- Only use RHF/Zod once the dependencies are actually installed in
  `package.json`; absence is a blocker, not a reason for fictitious code.
