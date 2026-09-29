import type { Work, WorkImage } from "@/lib/api/works";

import { sortWorkImages } from "../../trabalhos/_components/work-image-grid";

/** Imagens elegíveis de um work, na ordem de exibição (`order`). */
export type HomeImageCandidateGroup = {
  workId: string;
  workTitle: string;
  images: WorkImage[];
};

/** Referência de imagem da Home: identidade por IDs, nunca por URL. */
export type HomeImageRef = {
  workId: string;
  imageId: string;
};

/**
 * Espelha a regra de elegibilidade do backend (CARSHOP-159): apenas works
 * `published`, não removidos logicamente e com ao menos uma imagem. Mantém
 * a ordem da API. Função pura — usada como `select` da query de candidatas.
 */
export function selectHomeImageCandidates(
  works: Work[],
): HomeImageCandidateGroup[] {
  return works
    .filter(
      (work) =>
        work.status === "published" &&
        work.deletedAt === null &&
        work.images.length > 0,
    )
    .map((work) => ({
      workId: work.id,
      workTitle: work.title,
      images: sortWorkImages(work.images),
    }));
}

export function isSameHomeImageRef(
  a: HomeImageRef | null | undefined,
  b: HomeImageRef | null | undefined,
): boolean {
  if (!a || !b) {
    return false;
  }

  return a.workId === b.workId && a.imageId === b.imageId;
}

/** Posição (1-based) e título da candidata referenciada, se ainda existir. */
export type HomeImageCandidateMatch = {
  group: HomeImageCandidateGroup;
  image: WorkImage;
  index: number;
};

export function findHomeImageCandidate(
  groups: readonly HomeImageCandidateGroup[] | undefined,
  ref: HomeImageRef | null | undefined,
): HomeImageCandidateMatch | null {
  if (!groups || !ref) {
    return null;
  }

  const group = groups.find((candidate) => candidate.workId === ref.workId);
  const index =
    group?.images.findIndex((image) => image.id === ref.imageId) ?? -1;

  if (!group || index < 0) {
    return null;
  }

  return { group, image: group.images[index], index };
}
