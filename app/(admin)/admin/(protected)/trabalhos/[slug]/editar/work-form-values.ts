import type { Work } from "@/lib/api/works";
import type { WorkFormInput } from "@/schemas/work";

/** Converte um `Work` carregado nos valores de entrada do formulário. */
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
