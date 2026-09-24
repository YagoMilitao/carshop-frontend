import type { Work, WorkImage } from '@/lib/api/works'

function makeImage(id: string): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Interior ${id}`,
    isCover: true,
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  }
}

export function makeServiceWork(id: string, category: string, hasImage = true): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category,
    tags: [],
    images: hasImage ? [makeImage(`${id}-cover`)] : [],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}
