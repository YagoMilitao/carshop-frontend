import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCoverImage,
  getWorkBySlug,
  getWorks,
  WORKS_REVALIDATE_SECONDS,
  type Work,
} from "./works";

/**
 * `lib/api/works.ts` declara `import "server-only"` (proteção
 * Server-Component-only). Sob Vitest/Node essa condição sempre lança
 * incondicionalmente (ver `lib/env/server.test.ts` para o detalhe) —
 * mockamos como no-op para testar a lógica de fetch isoladamente, mesmo
 * comportamento do branch `"react-server"` real usado pelo Next.js.
 */
vi.mock("server-only", () => ({}));

const baseWork: Work = {
  id: "1a2b3c4d-0000-0000-0000-000000000001",
  slug: "restauracao-banco-fusca-1978",
  title: "Restauração de banco — Fusca 1978",
  description: "Restauração completa do banco original.",
  category: "Estofamento",
  tags: ["fusca", "restauracao"],
  images: [
    {
      id: "img-1",
      url: "https://cdn.example.com/img-1.jpg",
      publicId: "img-1",
      alt: "Banco restaurado",
      isCover: true,
      order: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    },
  ],
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
  deletedAt: null,
};

function mockFetchOnce(works: Work[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => works,
    }),
  );
}

describe("lib/api/works", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("getWorks", () => {
    it("busca `GET /works` via fetch nativo e retorna o array mapeado do JSON", async () => {
      mockFetchOnce([baseWork]);

      const works = await getWorks();

      expect(works).toEqual([baseWork]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/works"),
        expect.objectContaining({
          next: { revalidate: WORKS_REVALIDATE_SECONDS, tags: ["works"] },
        }),
      );
    });

    it("lança erro quando a resposta não é ok (após esgotar retries)", async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500 }),
      );

      const resultPromise = expect(getWorks()).rejects.toThrow();
      await vi.runAllTimersAsync();
      await resultPromise;

      vi.useRealTimers();
    });
  });

  describe("getWorkBySlug", () => {
    it("retorna o work cujo slug bate com o parâmetro", async () => {
      mockFetchOnce([baseWork]);

      const work = await getWorkBySlug(baseWork.slug);

      expect(work).toEqual(baseWork);
    });

    it("retorna undefined quando nenhum work bate com o slug", async () => {
      mockFetchOnce([baseWork]);

      const work = await getWorkBySlug("slug-inexistente");

      expect(work).toBeUndefined();
    });
  });

  describe("getCoverImage", () => {
    it("retorna a imagem com isCover: true", () => {
      const cover = getCoverImage(baseWork);

      expect(cover).toEqual(baseWork.images[0]);
    });

    it("retorna undefined quando nenhuma imagem é capa", () => {
      const workWithoutCover: Work = {
        ...baseWork,
        images: [{ ...baseWork.images[0], isCover: false }],
      };

      expect(getCoverImage(workWithoutCover)).toBeUndefined();
    });
  });
});
