import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/api/http", () => ({
  http: {
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import {
  approveComment,
  createComment,
  deleteComment,
  updateComment,
} from "./comments.client";

const comment = {
  id: "c-1",
  workId: "work-1",
  authorName: "Cliente",
  content: "Ficou ótimo!",
  status: "PENDING" as const,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("lib/api/comments.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createComment", () => {
    it("chama POST /works/:workId/comments (público) e retorna o comentário PENDING criado", async () => {
      postMock.mockResolvedValue({ data: comment });

      const result = await createComment("work-1", {
        authorName: "Cliente",
        content: "Ficou ótimo!",
      });

      expect(postMock).toHaveBeenCalledWith("/works/work-1/comments", {
        authorName: "Cliente",
        content: "Ficou ótimo!",
      });
      expect(result).toEqual(comment);
      expect(result.status).toBe("PENDING");
    });

    it("propaga o erro da API quando a criação falha", async () => {
      const apiError = { response: { data: { message: "Conteúdo obrigatório." } } };
      postMock.mockRejectedValue(apiError);

      await expect(
        createComment("work-1", { authorName: "", content: "" }),
      ).rejects.toBe(apiError);
    });
  });

  describe("approveComment", () => {
    it("chama PATCH /admin/comments/:commentId/approve", async () => {
      patchMock.mockResolvedValue({
        data: { ...comment, status: "APPROVED" },
      });

      const result = await approveComment("c-1");

      expect(patchMock).toHaveBeenCalledWith(
        "/admin/comments/c-1/approve",
      );
      expect(result.status).toBe("APPROVED");
    });

    it("propaga o erro da API quando a aprovação falha", async () => {
      const apiError = { response: { data: { message: "Not found." } } };
      patchMock.mockRejectedValue(apiError);

      await expect(approveComment("c-x")).rejects.toBe(apiError);
    });
  });

  describe("updateComment", () => {
    it("chama PATCH /admin/comments/:commentId com o payload", async () => {
      patchMock.mockResolvedValue({
        data: { ...comment, content: "Editado" },
      });

      const result = await updateComment("c-1", { content: "Editado" });

      expect(patchMock).toHaveBeenCalledWith("/admin/comments/c-1", {
        content: "Editado",
      });
      expect(result.content).toBe("Editado");
    });

    it("propaga o erro da API quando a edição falha", async () => {
      const apiError = { response: { data: { message: "Conteúdo inválido." } } };
      patchMock.mockRejectedValue(apiError);

      await expect(
        updateComment("c-1", { content: "" }),
      ).rejects.toBe(apiError);
    });
  });

  describe("deleteComment", () => {
    it("chama DELETE /admin/comments/:commentId", async () => {
      deleteMock.mockResolvedValue({ data: undefined });

      await deleteComment("c-1");

      expect(deleteMock).toHaveBeenCalledWith("/admin/comments/c-1");
    });

    it("propaga o erro da API quando a exclusão falha", async () => {
      const apiError = { response: { data: { message: "Not found." } } };
      deleteMock.mockRejectedValue(apiError);

      await expect(deleteComment("c-x")).rejects.toBe(apiError);
    });
  });
});
