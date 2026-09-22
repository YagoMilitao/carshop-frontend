import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/lib/api/http", () => ({
  http: {
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import {
  adminCommentsQueryKey,
  approveComment,
  createComment,
  deleteComment,
  getAdminComments,
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

  describe("adminCommentsQueryKey", () => {
    it("inclui o status no array da query key quando informado", () => {
      expect(adminCommentsQueryKey("PENDING")).toEqual([
        "admin",
        "comments",
        "PENDING",
      ]);
    });

    it("mantém status undefined quando nenhum filtro é informado", () => {
      expect(adminCommentsQueryKey()).toEqual(["admin", "comments", undefined]);
    });

    it("inclui paginação para diferenciar cada página no cache", () => {
      expect(adminCommentsQueryKey("PENDING", 2, 20)).toEqual([
        "admin",
        "comments",
        "PENDING",
        { page: 2, limit: 20 },
      ]);
    });
  });

  describe("getAdminComments", () => {
    it("chama GET /admin/comments com status/page/limit e retorna a resposta paginada", async () => {
      const paginated = {
        items: [comment],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      };
      getMock.mockResolvedValue({ data: paginated });

      const result = await getAdminComments({ status: "PENDING", page: 1 });

      expect(getMock).toHaveBeenCalledWith("/admin/comments", {
        params: { status: "PENDING", page: 1 },
      });
      expect(result).toEqual(paginated);
    });

    it("chama GET /admin/comments sem parâmetros quando nenhum filtro é informado", async () => {
      getMock.mockResolvedValue({
        data: { items: [], page: 1, limit: 20, total: 0, totalPages: 1 },
      });

      await getAdminComments();

      expect(getMock).toHaveBeenCalledWith("/admin/comments", { params: {} });
    });

    it("propaga o erro da API quando a listagem falha", async () => {
      const apiError = { response: { data: { message: "Not found." } } };
      getMock.mockRejectedValue(apiError);

      await expect(getAdminComments()).rejects.toBe(apiError);
    });
  });
});
