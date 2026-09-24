import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateCommentsTagMock = vi.fn<(workId: string) => Promise<void>>();

vi.mock("../../../actions", () => ({
  revalidateCommentsTag: (workId: string) => revalidateCommentsTagMock(workId),
}));

import { syncAfterCommentMutation } from "./comment-moderation-sync";

describe("syncAfterCommentMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    revalidateCommentsTagMock.mockResolvedValue(undefined);
  });

  it("invalida a chave base ['admin','comments'] e revalida a tag do work", async () => {
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    await syncAfterCommentMutation(queryClient, "work-1");

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "comments"],
    });
    expect(revalidateCommentsTagMock).toHaveBeenCalledWith("work-1");
  });

  it("invalida queries de todos os status/páginas (prefixo)", async () => {
    queryClient.setQueryData(["admin", "comments", "PENDING", { page: 1, limit: 20 }], 1);
    queryClient.setQueryData(["admin", "comments", "APPROVED", { page: 2, limit: 20 }], 2);
    queryClient.setQueryData(["admin", "comments", undefined, { page: 1, limit: 5 }], 3);
    queryClient.setQueryData(["admin", "works"], 4);

    await syncAfterCommentMutation(queryClient, "work-1");

    const invalidated = queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => query.state.isInvalidated)
      .map((query) => query.queryKey[1]);

    expect(invalidated).toEqual(["comments", "comments", "comments"]);
    expect(
      queryClient.getQueryState(["admin", "works"])?.isInvalidated,
    ).toBe(false);
  });

  it("não rejeita quando a revalidação da tag falha", async () => {
    vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    revalidateCommentsTagMock.mockRejectedValue(new Error("server action"));

    await expect(
      syncAfterCommentMutation(queryClient, "work-1"),
    ).resolves.toBeUndefined();
  });

  it("não rejeita quando a invalidação do cache falha", async () => {
    vi.spyOn(queryClient, "invalidateQueries").mockRejectedValue(
      new Error("cache"),
    );

    await expect(
      syncAfterCommentMutation(queryClient, "work-1"),
    ).resolves.toBeUndefined();
    expect(revalidateCommentsTagMock).toHaveBeenCalledWith("work-1");
  });
});
