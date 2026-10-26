import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/api/comments.ts` declara `import "server-only"` — mockado como
 * no-op, mesmo padrão de `lib/api/works.test.ts`. `fetch` é mockado —
 * nenhuma chamada de rede real.
 */
vi.mock("server-only", () => ({}));

import { serverEnv } from "@/lib/env/server";
import {
  getWorkComments,
  WORK_COMMENTS_REVALIDATE_SECONDS,
  workCommentsTag,
  type Comment,
} from "./comments";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function waitForAbort(signal: AbortSignal): Promise<Response> {
  return new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });
}

const approvedComment: Comment = {
  id: "c-1",
  workId: "work-1",
  authorName: "Cliente",
  content: "Ficou ótimo!",
  status: "APPROVED",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("lib/api/comments", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("workCommentsTag", () => {
    it("gera a tag de cache a partir do workId", () => {
      expect(workCommentsTag("work-1")).toBe("work-comments-work-1");
    });
  });

  describe("getWorkComments", () => {
    it("busca GET /works/:workId/comments com revalidate e tags corretos e retorna a lista aprovada", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [approvedComment],
      });
      vi.stubGlobal("fetch", fetchMock);

      const comments = await getWorkComments("work-1");

      expect(comments).toEqual([approvedComment]);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/works/work-1/comments"),
        expect.objectContaining({
          next: {
            revalidate: WORK_COMMENTS_REVALIDATE_SECONDS,
            tags: [workCommentsTag("work-1")],
          },
        }),
      );
    });

    it("lança erro quando a resposta não é ok (após esgotar retries)", async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500 }),
      );

      const resultPromise = expect(getWorkComments("work-1")).rejects.toThrow();
      await vi.runAllTimersAsync();
      await resultPromise;

      vi.useRealTimers();
    });

    it("sem options: não envia signal nem cria timer (comportamento original)", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse([approvedComment]));
      vi.stubGlobal("fetch", fetchMock);

      await expect(getWorkComments("work-1")).resolves.toEqual([
        approvedComment,
      ]);

      const [input, init] = fetchMock.mock.calls[0] ?? [];
      expect(input).toBe(`${serverEnv.apiUrl}/works/work-1/comments`);
      expect(init).toEqual({
        next: {
          revalidate: WORK_COMMENTS_REVALIDATE_SECONDS,
          tags: [workCommentsTag("work-1")],
        },
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it("sem options: usa o orçamento padrão de retry (5 tentativas em 500)", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({}, 500));
      vi.stubGlobal("fetch", fetchMock);

      const assertion = expect(getWorkComments("work-1")).rejects.toThrow();
      await vi.runAllTimersAsync();
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(5);
    });

    it("com timeoutMs: envia um AbortSignal novo por tentativa e mantém URL/revalidate/tags", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse([approvedComment]));
      vi.stubGlobal("fetch", fetchMock);

      await getWorkComments("work-1", { timeoutMs: 1_000 });

      const [input, init] = fetchMock.mock.calls[0] ?? [];
      expect(input).toBe(`${serverEnv.apiUrl}/works/work-1/comments`);
      expect(init).toEqual({
        signal: expect.any(AbortSignal),
        next: {
          revalidate: WORK_COMMENTS_REVALIDATE_SECONDS,
          tags: [workCommentsTag("work-1")],
        },
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it("com timeoutMs: aborta a tentativa que excede o limite e limpa os timers", async () => {
      vi.useFakeTimers();
      const signals: AbortSignal[] = [];
      const fetchMock = vi.fn<typeof fetch>((_input, init) => {
        const signal = init?.signal;

        if (!(signal instanceof AbortSignal)) {
          return Promise.reject(new Error("AbortSignal ausente"));
        }

        signals.push(signal);
        return waitForAbort(signal);
      });
      vi.stubGlobal("fetch", fetchMock);

      const assertion = expect(
        getWorkComments("work-1", {
          timeoutMs: 1_000,
          retry: { retries: 1, baseDelayMs: 500 },
        }),
      ).rejects.toBeDefined();
      await vi.advanceTimersByTimeAsync(999);
      expect(signals[0]?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(signals[0]?.aborted).toBe(true);
      await vi.advanceTimersByTimeAsync(500 + 1_000);
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(signals[1]?.aborted).toBe(true);
      expect(signals[0]).not.toBe(signals[1]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("com retry customizado: respeita o orçamento informado", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({}, 429));
      vi.stubGlobal("fetch", fetchMock);

      const assertion = expect(
        getWorkComments("work-1", { retry: { retries: 1, baseDelayMs: 500 } }),
      ).rejects.toMatchObject({ status: 429 });
      await vi.runAllTimersAsync();
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("não repete em 404 (4xx diferente de 429)", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({}, 404));
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        getWorkComments("work-1", { retry: { retries: 1, baseDelayMs: 500 } }),
      ).rejects.toMatchObject({ status: 404 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
