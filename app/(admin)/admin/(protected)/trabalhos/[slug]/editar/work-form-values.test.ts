import { describe, expect, it } from "vitest";

import type { Work } from "@/lib/api/works";
import { workFormSchema } from "@/schemas/work";

import { mapWorkToFormValues } from "./work-form-values";

function buildWork(overrides: Partial<Work> = {}): Work {
  return {
    id: "1",
    slug: "restauracao-fusca",
    title: "Restauração Fusca",
    description: "Descrição completa do serviço.",
    category: "Estofamento",
    tags: ["fusca", "restauracao"],
    images: [],
    status: "draft",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("mapWorkToFormValues", () => {
  it("converte tags de array para string separada por vírgula e mantém os demais campos 1:1", () => {
    const work = buildWork();

    expect(mapWorkToFormValues(work)).toEqual({
      slug: "restauracao-fusca",
      title: "Restauração Fusca",
      description: "Descrição completa do serviço.",
      category: "Estofamento",
      tags: "fusca, restauracao",
      status: "draft",
    });
  });

  it("converte um work publicado preservando o status", () => {
    const work = buildWork({ status: "published", tags: ["couro"] });

    const values = mapWorkToFormValues(work);

    expect(values.status).toBe("published");
    expect(values.tags).toBe("couro");
  });

  it("produz valores compatíveis com o schema compartilhado", () => {
    const work = buildWork();

    const result = workFormSchema.safeParse(mapWorkToFormValues(work));

    expect(result.success).toBe(true);
  });
});
