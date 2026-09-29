import type { Work, WorkImage } from "@/lib/api/works";

export function makeImage(
  id: string,
  order: number,
  overrides: Partial<WorkImage> = {},
): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/image/upload/${id}.jpg`,
    publicId: `carshop/${id}`,
    alt: "",
    isCover: false,
    order,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeWork(id: string, overrides: Partial<Work> = {}): Work {
  return {
    id,
    slug: id,
    title: `Trabalho ${id}`,
    description: "Descrição",
    category: "Estofamento",
    tags: [],
    images: [makeImage(`${id}-img-1`, 0)],
    status: "published",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}
