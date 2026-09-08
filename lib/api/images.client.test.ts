import { beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/api/http", () => ({
  http: {
    post: (...args: unknown[]) => postMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  deleteWorkImage,
  uploadWorkImage,
} from "./images.client";

describe("lib/api/images.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exporta o limite de 5MB e os tipos aceitos (JPEG/PNG/WebP)", () => {
    expect(MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    expect(ACCEPTED_IMAGE_MIME_TYPES).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });

  describe("uploadWorkImage", () => {
    it("monta um FormData com o arquivo e faz POST multipart para /admin/works/:workId/images", async () => {
      const file = new File(["conteudo"], "foto.png", { type: "image/png" });
      const uploaded = {
        id: "img-1",
        url: "https://cdn.example.com/img-1.png",
        publicId: "img-1",
        alt: "",
        isCover: false,
        order: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };
      postMock.mockResolvedValue({ data: uploaded });

      const result = await uploadWorkImage("work-1", file);

      expect(postMock).toHaveBeenCalledTimes(1);
      const [url, formData, config] = postMock.mock.calls[0] as [
        string,
        FormData,
        { headers: Record<string, string> },
      ];
      expect(url).toBe("/admin/works/work-1/images");
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("image")).toBe(file);
      expect(config.headers["Content-Type"]).toBe("multipart/form-data");
      expect(result).toEqual(uploaded);
    });

    it("propaga o erro da API quando o upload falha (ex.: tamanho/tipo inválido)", async () => {
      const apiError = {
        response: { data: { message: "Arquivo excede 5MB." } },
      };
      postMock.mockRejectedValue(apiError);

      const file = new File(["x"], "foto.png", { type: "image/png" });

      await expect(uploadWorkImage("work-1", file)).rejects.toBe(apiError);
    });
  });

  describe("deleteWorkImage", () => {
    it("chama DELETE /admin/works/:workId/images/:imageId", async () => {
      deleteMock.mockResolvedValue({ data: undefined });

      await deleteWorkImage("work-1", "img-1");

      expect(deleteMock).toHaveBeenCalledWith(
        "/admin/works/work-1/images/img-1",
      );
    });

    it("propaga o erro da API quando a exclusão falha", async () => {
      const apiError = { response: { data: { message: "Not found." } } };
      deleteMock.mockRejectedValue(apiError);

      await expect(deleteWorkImage("work-1", "img-x")).rejects.toBe(apiError);
    });
  });
});
