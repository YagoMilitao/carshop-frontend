import type { Work } from "@/lib/api/works"
import type { ProjectPreviewItem } from "../../_components/project-preview"
import { resolvePreviewImage } from "../../portfolio/_lib/resolve-preview-image"

export type ServiceCategory = {
  key: string
  label: string
  works: Work[]
  preview: ProjectPreviewItem | null
}

/** Quantidade máxima de links de projeto listados por categoria. */
export const SERVICE_PROJECT_LINKS_LIMIT = 4

function collapseWhitespace(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ")
}

/**
 * Agrupa works pela `category` real da API (CARSHOP-147).
 *
 * Normalização conservadora: NFC + trim + espaços colapsados +
 * lower-case; sem stemming nem sinônimos, acentos preservados. O label
 * exibido é o da primeira ocorrência (sem alterar caixa) e a ordem é a de
 * primeira aparição na ordem da API. Categorias vazias são descartadas.
 */
export function groupWorksByCategory(
  works: readonly Work[],
): ServiceCategory[] {
  const groups = new Map<string, ServiceCategory>()

  for (const work of works) {
    const label = collapseWhitespace(work.category)

    if (label === "") {
      continue
    }

    const key = label.toLocaleLowerCase("pt-BR")
    let group = groups.get(key)

    if (!group) {
      group = { key, label, works: [], preview: null }
      groups.set(key, group)
    }

    group.works.push(work)

    if (!group.preview) {
      const image = resolvePreviewImage(work)

      if (image) {
        group.preview = { work, image }
      }
    }
  }

  return Array.from(groups.values())
}
