# Regra: UI e Design System

- **TailwindCSS** é a estilização oficial-alvo; **Shadcn/UI** para
  componentes base quando apropriado; **Framer Motion** para animações
  quando justificadas pela task (não por padrão); **React Icons** para
  ícones.
- Figma aprovado é fonte de verdade visual quando houver design aprovado —
  agentes não redesenham a interface por preferência própria.
- Enquanto Tailwind/Shadcn não estiverem instalados no `package.json`, a
  estilização segue o padrão já usado em `src/*.css` (CSS/CSS Modules);
  ausência da dependência-alvo é bloqueio, não motivo para simular classes
  Tailwind sem a lib instalada.
- Markup usa elementos HTML semânticos apropriados por padrão (não
  `div`/`span` para tudo).
- Consistência visual (espaçamento, tipografia, cores) é mantida entre
  componentes e páginas já existentes.
