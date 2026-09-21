import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/api/http", () => ({
  http: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import {
  createWork,
  deleteWork,
  getAdminWorks,
  type CreateWorkPayload,
} from "./works.client";

describe("lib/api/works.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdminWorks", () => {
    it("busca trabalhos publicados e rascunhos pela rota autenticada", async () => {
      const works = [{ id: "1", status: "draft" }];
      getMock.mockResolvedValue({ data: works });

      const result = await getAdminWorks();

      expect(getMock).toHaveBeenCalledWith("/works", {
        params: { includeDrafts: true },
      });
      expect(result).toEqual(works);
    });

    it("propaga o erro da API quando a listagem administrativa falha", async () => {
      const apiError = { response: { status: 401 } };
      getMock.mockRejectedValue(apiError);

      await expect(getAdminWorks()).rejects.toBe(apiError);
    });
  });

  describe("createWork", () => {
    it("chama POST /works com o payload e retorna o work criado", async () => {
      const payload: CreateWorkPayload = {
        slug: "restauracao-fusca",
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
          slug: "",
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
