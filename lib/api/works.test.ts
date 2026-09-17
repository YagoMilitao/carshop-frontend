import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCoverImage,
  getWorkBySlug,
  getWorks,
  WORKS_REQUEST_TIMEOUT_MS,
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
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("getWorks", () => {
    it("busca `GET /works` via fetch nativo e retorna o array mapeado do JSON", async () => {
      vi.useFakeTimers();
      mockFetchOnce([baseWork]);

      const works = await getWorks();

      expect(works).toEqual([baseWork]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/works"),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          next: { revalidate: WORKS_REVALIDATE_SECONDS, tags: ["works"] },
        }),
      );
      expect(vi.getTimerCount()).toBe(0);
    });

    it("faz uma nova requisição por retry sem remover a configuração de ISR", async () => {
      vi.useFakeTimers();
      const signals: AbortSignal[] = [];
      const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
        if (init?.signal) {
          signals.push(init.signal);
        }

        if (signals.length === 1) {
          return new Response(null, { status: 503 });
        }

        return new Response(JSON.stringify([baseWork]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      const resultPromise = getWorks();
      await vi.runAllTimersAsync();

      await expect(resultPromise).resolves.toEqual([baseWork]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
      expect(signals).toHaveLength(2);
      expect(signals[0]).not.toBe(signals[1]);

      for (const [, init] of fetchMock.mock.calls) {
        expect(init).toEqual(
          expect.objectContaining({
            signal: expect.any(AbortSignal),
            next: {
              revalidate: WORKS_REVALIDATE_SECONDS,
              tags: ["works"],
            },
          }),
        );
      }
    });

    it("aborta uma tentativa lenta antes de executar o próximo retry", async () => {
      vi.useFakeTimers();
      const signals: AbortSignal[] = [];
      const fetchMock = vi.fn<typeof fetch>((_input, init) => {
        const signal = init?.signal;

        if (!signal) {
          return Promise.reject(new Error("AbortSignal ausente"));
        }

        signals.push(signal);

        if (signals.length > 1) {
          return Promise.resolve(
            new Response(JSON.stringify([baseWork]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      const resultPromise = getWorks();
      const assertion = expect(resultPromise).resolves.toEqual([baseWork]);
      await vi.advanceTimersByTimeAsync(WORKS_REQUEST_TIMEOUT_MS);
      await vi.advanceTimersByTimeAsync(500);

      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
      expect(signals[0]?.aborted).toBe(true);
      expect(signals[1]?.aborted).toBe(false);
      expect(signals[0]).not.toBe(signals[1]);
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

    it("não repete uma resposta 4xx e limpa o timeout da tentativa", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 404 }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(getWorks()).rejects.toMatchObject({
        name: "HttpError",
        status: 404,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
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
