import type { Work } from "@/lib/api/works"
import type { ProjectPreviewItem } from "../../_components/project-preview"
import { resolvePreviewImage } from "./resolve-preview-image"

export type PortfolioRole = "lead" | "wide" | "narrow" | "solo"

export type PortfolioEntry = {
  item: ProjectPreviewItem
  role: PortfolioRole
}

export type PortfolioLayout = {
  entries: PortfolioEntry[]
  textOnly: Work[]
}

/**
 * Composição editorial da listagem `/portfolio`, preservando a ordem da API:
 * o primeiro work com imagem abre como `lead`; os seguintes formam pares
 * alternados `[wide, narrow]` (7/5) e `[narrow, wide]` (5/7); um último
 * item sem par vira `solo`. Works sem nenhuma imagem vão para `textOnly`.
 */
export function buildPortfolioLayout(works: readonly Work[]): PortfolioLayout {
  const withImage: ProjectPreviewItem[] = []
  const textOnly: Work[] = []

  for (const work of works) {
    const image = resolvePreviewImage(work)

    if (image) {
      withImage.push({ work, image })
    } else {
      textOnly.push(work)
    }
  }

  const [lead, ...rest] = withImage
  const entries: PortfolioEntry[] = []

  if (lead) {
    entries.push({ item: lead, role: "lead" })
  }

  for (let index = 0; index < rest.length; index += 2) {
    const first = rest[index]
    const second = rest[index + 1]

    if (!second) {
      entries.push({ item: first, role: "solo" })
      break
    }

    const pairIndex = index / 2
    const [firstRole, secondRole]: [PortfolioRole, PortfolioRole] =
      pairIndex % 2 === 0 ? ["wide", "narrow"] : ["narrow", "wide"]

    entries.push({ item: first, role: firstRole }, { item: second, role: secondRole })
  }

  return { entries, textOnly }
}
