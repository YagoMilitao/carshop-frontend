import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const patchMock = vi.fn();

vi.mock("@/lib/api/http", () => ({
  http: {
    get: (...args: unknown[]) => getMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
}));

import type { HomeImage } from "@/lib/api/home-image";

import {
  getHomeImage,
  homeImageQueryKey,
  setHomeImage,
  type SetHomeImagePayload,
} from "./home-image.client";

const image: HomeImage = {
  workId: "work-1",
  imageId: "img-1",
  url: "https://res.cloudinary.com/demo/image/upload/banco.jpg",
  alt: "Banco em couro",
};

describe("lib/api/home-image.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expõe a query key estável ['home-image']", () => {
    expect(homeImageQueryKey).toEqual(["home-image"]);
  });

  describe("getHomeImage", () => {
    it("chama GET /home-image e retorna a imagem configurada", async () => {
      getMock.mockResolvedValue({ data: { image } });

      await expect(getHomeImage()).resolves.toEqual(image);
      expect(getMock).toHaveBeenCalledWith("/home-image");
    });

    it("retorna null quando nenhuma imagem está configurada", async () => {
      getMock.mockResolvedValue({ data: { image: null } });

      await expect(getHomeImage()).resolves.toBeNull();
    });

    it("propaga o erro da API", async () => {
      const apiError = { response: { status: 429 } };
      getMock.mockRejectedValue(apiError);

      await expect(getHomeImage()).rejects.toBe(apiError);
    });
  });

  describe("setHomeImage", () => {
    it("chama PATCH /admin/home-image com { workId, imageId } e retorna a imagem", async () => {
      patchMock.mockResolvedValue({ data: { image } });

      await expect(
        setHomeImage({ workId: "work-1", imageId: "img-1" }),
      ).resolves.toEqual(image);
      expect(patchMock).toHaveBeenCalledWith("/admin/home-image", {
        workId: "work-1",
        imageId: "img-1",
      });
    });

    it("envia exatamente { workId, imageId } mesmo recebendo um objeto mais largo", async () => {
      patchMock.mockResolvedValue({ data: { image } });
      const wider = {
        workId: "work-1",
        imageId: "img-1",
        url: "https://evil.example.com/x.jpg",
        alt: "extra",
      };
      // Atribuição estrutural (sem cast): um objeto mais largo é aceito
      // pelo tipo, mas não pode vazar campos extras para o body.
      const payload: SetHomeImagePayload = wider;

      await setHomeImage(payload);

      const body: unknown = patchMock.mock.calls[0]?.[1];
      expect(body).toStrictEqual({ workId: "work-1", imageId: "img-1" });
      expect(Object.keys(body ?? {})).toEqual(["workId", "imageId"]);
    });

    it("lança erro quando a resposta traz image: null", async () => {
      patchMock.mockResolvedValue({ data: { image: null } });

      await expect(
        setHomeImage({ workId: "work-1", imageId: "img-1" }),
      ).rejects.toThrow("imagem da Home ausente");
    });

    it("propaga o erro da API", async () => {
      const apiError = { response: { status: 409 } };
      patchMock.mockRejectedValue(apiError);

      await expect(
        setHomeImage({ workId: "work-1", imageId: "img-1" }),
      ).rejects.toBe(apiError);
    });
  });
});
