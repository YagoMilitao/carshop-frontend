import { z } from "zod";

import type { Work } from "@/lib/api/works";

// Limites de `title`/`description` refletem as restrições reais já
// validadas pelo backend (`carshop-backend`) — não são valores inventados.
// Compartilhado entre criação (CARSHOP-134) e edição (CARSHOP-32) para
// manter as mesmas regras de validação em ambos os fluxos.
export const workFormSchema = z.object({
  slug: z.string().trim().min(1, "Informe o identificador da URL."),
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(120, "O título deve ter no máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição.")
    .max(5000, "A descrição deve ter no máximo 5000 caracteres."),
  category: z.string().trim().min(1, "Informe a categoria."),
  tags: z
    .string()
    .min(1, "Informe ao menos uma tag.")
    .transform((value) =>
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    )
    .refine((tags) => tags.length > 0, "Informe ao menos uma tag."),
  status: z.enum(["published", "draft"], {
    error: "Selecione o status.",
  }),
});

export type WorkFormInput = z.input<typeof workFormSchema>;
export type WorkFormOutput = z.output<typeof workFormSchema>;

/**
 * Converte um `Work` já carregado nos valores iniciais do formulário
 * compartilhado (`WorkFormInput`). Usada pela edição (CARSHOP-32) para
 * pré-preencher `useForm` a partir dos dados reais do work. `tags` é
 * convertido de `string[]` para `string` (mesmo formato de entrada aceito
 * pelo campo de texto); os demais campos são 1:1.
 */
export function mapWorkToFormValues(work: Work): WorkFormInput {
  return {
    slug: work.slug,
    title: work.title,
    description: work.description,
    category: work.category,
    tags: work.tags.join(", "),
    status: work.status,
  };
}
