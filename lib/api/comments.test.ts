import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/api/comments.ts` declara `import "server-only"` — mockado como
 * no-op, mesmo padrão de `lib/api/works.test.ts`. `fetch` é mockado —
 * nenhuma chamada de rede real.
 */
vi.mock("server-only", () => ({}));

import {
  getWorkComments,
  WORK_COMMENTS_REVALIDATE_SECONDS,
  workCommentsTag,
  type Comment,
} from "./comments";

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

    it("lança erro quando a resposta não é ok", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500 }),
      );

      await expect(getWorkComments("work-1")).rejects.toThrow();
    });
  });
});
