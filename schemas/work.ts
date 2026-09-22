import { z } from "zod";

// Limites de `title`/`description` refletem as restrições reais já
// validadas pelo backend (`carshop-backend`) — não são valores inventados.
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
