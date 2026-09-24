import { describe, expect, it, vi } from "vitest"
import type { Work, WorkImage } from "@/lib/api/works"
import { buildProjectGallery } from "./build-project-gallery"

// `resolvePreviewImage` reusa `getCoverImage` de `lib/api/works` (server-only).
vi.mock("server-only", () => ({}))

function makeImage(id: string, order: number, isCover = false): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt: `Alt ${id}`,
    isCover,
    order,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  }
}

function makeWork(images: WorkImage[]): Work {
  return {
    id: "work-1",
    slug: "work-1",
    title: "Work 1",
    description: "Description",
    category: "Upholstery",
    tags: [],
    images,
    status: "published",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    deletedAt: null,
  }
}

function makeImages(count: number): WorkImage[] {
  return Array.from({ length: count }, (_, index) =>
    makeImage(`img-${index}`, index, index === 0),
  )
}

describe("buildProjectGallery", () => {
  it("sem imagens: sem hero, sem entradas e sem imagens no viewer", () => {
    expect(buildProjectGallery(makeWork([]))).toEqual({
      hero: null,
      entries: [],
      viewerImages: [],
    })
  })

  it.each([
    [1, []],
    [2, ["solo"]],
    [3, ["wide", "narrow"]],
    [4, ["wide", "narrow", "solo"]],
    [5, ["wide", "narrow", "narrow", "wide"]],
    [6, ["wide", "narrow", "narrow", "wide", "solo"]],
    [7, ["wide", "narrow", "narrow", "wide", "wide", "narrow"]],
  ])("%i imagem(ns) → papéis %j após o hero", (count, roles) => {
    const layout = buildProjectGallery(makeWork(makeImages(count)))

    expect(layout.hero?.id).toBe("img-0")
    expect(layout.entries.map((entry) => entry.role)).toEqual(roles)
    expect(layout.viewerImages).toHaveLength(count)
  })

  it("sem isCover, usa a imagem de menor order como hero", () => {
    const images = [makeImage("b", 2), makeImage("a", 1), makeImage("c", 3)]
    const layout = buildProjectGallery(makeWork(images))

    expect(layout.hero?.id).toBe("a")
    expect(layout.entries.map((entry) => entry.image.id)).toEqual(["b", "c"])
  })

  it("não repete a capa na sequência, mesmo com order intermediário", () => {
    const images = [
      makeImage("a", 0),
      makeImage("b", 1),
      makeImage("cover", 3, true),
      makeImage("c", 4),
    ]
    const layout = buildProjectGallery(makeWork(images))

    expect(layout.hero?.id).toBe("cover")
    expect(layout.entries.map((entry) => entry.image.id)).toEqual([
      "a",
      "b",
      "c",
    ])
  })

  it("preserva a ordem da API para order duplicado (sort estável)", () => {
    const images = [
      makeImage("cover", 0, true),
      makeImage("x", 1),
      makeImage("y", 1),
      makeImage("z", 1),
    ]
    const layout = buildProjectGallery(makeWork(images))

    expect(layout.entries.map((entry) => entry.image.id)).toEqual([
      "x",
      "y",
      "z",
    ])
  })

  it("mapeia viewerIndex: hero 0 e sequência a partir de 1, alinhado a viewerImages", () => {
    const layout = buildProjectGallery(makeWork(makeImages(4)))

    expect(layout.viewerImages[0]).toBe(layout.hero)
    for (const entry of layout.entries) {
      expect(layout.viewerImages[entry.viewerIndex]).toBe(entry.image)
    }
    expect(layout.entries.map((entry) => entry.viewerIndex)).toEqual([1, 2, 3])
  })

  it("não muta o array de imagens do work", () => {
    const images = [makeImage("c", 2), makeImage("a", 0, true), makeImage("b", 1)]
    const snapshot = images.map((image) => image.id)
    const work = makeWork(images)

    buildProjectGallery(work)

    expect(work.images.map((image) => image.id)).toEqual(snapshot)
  })
})
