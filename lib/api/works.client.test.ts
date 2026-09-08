import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/api/http", () => ({
  http: {
    post: (...args: unknown[]) => postMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import { createWork, deleteWork, type CreateWorkPayload } from "./works.client";

describe("lib/api/works.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createWork", () => {
    it("chama POST /works com o payload e retorna o work criado", async () => {
      const payload: CreateWorkPayload = {
        title: "Restauração",
        description: "Descrição",
        category: "Estofamento",
        tags: ["fusca"],
        status: "draft",
      };
      const created = { id: "1", ...payload };
      postMock.mockResolvedValue({ data: created });

      const result = await createWork(payload);

      expect(postMock).toHaveBeenCalledWith("/works", payload);
      expect(result).toEqual(created);
    });

    it("propaga o erro da API quando a mutação falha", async () => {
      const apiError = { response: { data: { message: "Campo inválido." } } };
      postMock.mockRejectedValue(apiError);

      await expect(
        createWork({
          title: "",
          description: "",
          category: "",
          tags: [],
          status: "draft",
        }),
      ).rejects.toBe(apiError);
    });
  });

  describe("deleteWork", () => {
    it("chama DELETE /admin/works/:workId", async () => {
      deleteMock.mockResolvedValue({ data: undefined });

      await deleteWork("work-1");

      expect(deleteMock).toHaveBeenCalledWith("/admin/works/work-1");
    });

    it("propaga o erro da API quando a exclusão falha", async () => {
      const apiError = { response: { data: { message: "Not found." } } };
      deleteMock.mockRejectedValue(apiError);

      await expect(deleteWork("inexistente")).rejects.toBe(apiError);
    });
  });
});
