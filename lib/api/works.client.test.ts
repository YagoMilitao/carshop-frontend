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

import type { Work } from "@/lib/api/works";

import {
  createWork,
  deleteWork,
  findAdminWorkBySlug,
  getAdminWorks,
  updateWork,
  type CreateWorkPayload,
} from "./works.client";

function buildWork(overrides: Partial<Work> = {}): Work {
  return {
    id: "1",
    slug: "restauracao-fusca",
    title: "Restauração Fusca",
    description: "Descrição",
    category: "Estofamento",
    tags: ["fusca"],
    images: [],
    status: "draft",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

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

  describe("findAdminWorkBySlug", () => {
    it("retorna o work correspondente ao slug informado", () => {
      const target = buildWork({ id: "2", slug: "banco-couro" });
      const works = [buildWork({ id: "1", slug: "restauracao-fusca" }), target];

      expect(findAdminWorkBySlug(works, "banco-couro")).toEqual(target);
    });

    it("retorna undefined quando nenhum work corresponde ao slug", () => {
      const works = [buildWork({ id: "1", slug: "restauracao-fusca" })];

      expect(findAdminWorkBySlug(works, "inexistente")).toBeUndefined();
    });

    it("retorna undefined para uma listagem vazia", () => {
      expect(findAdminWorkBySlug([], "restauracao-fusca")).toBeUndefined();
    });
  });

  describe("updateWork", () => {
    it("rejeita com um erro explicando o bloqueio da CARSHOP-135, sem chamar a API", async () => {
      const payload: CreateWorkPayload = {
        slug: "restauracao-fusca",
        title: "Restauração",
        description: "Descrição",
        category: "Estofamento",
        tags: ["fusca"],
        status: "draft",
      };

      await expect(updateWork("work-1", payload)).rejects.toThrow(
        /CARSHOP-135/,
      );

      expect(getMock).not.toHaveBeenCalled();
      expect(postMock).not.toHaveBeenCalled();
      expect(deleteMock).not.toHaveBeenCalled();
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
