import { describe, expect, it } from "vitest";

import { HOME_IMAGE_TAG, parseHomeImageResponse } from "./home-image";

const validImage = {
  workId: "work-1",
  imageId: "img-1",
  url: "https://res.cloudinary.com/demo/image/upload/v1/home.jpg",
  alt: "Banco de couro restaurado",
};

describe("lib/api/home-image", () => {
  it("expõe a tag de cache dedicada", () => {
    expect(HOME_IMAGE_TAG).toBe("home-image");
  });

  describe("parseHomeImageResponse", () => {
    it("retorna a imagem quando o corpo segue o contrato", () => {
      expect(parseHomeImageResponse({ image: validImage })).toEqual(validImage);
    });

    it("aceita `alt` vazio", () => {
      expect(parseHomeImageResponse({ image: { ...validImage, alt: "" } })).toEqual({
        ...validImage,
        alt: "",
      });
    });

    it("descarta campos extras fora do contrato", () => {
      expect(
        parseHomeImageResponse({ image: { ...validImage, publicId: "x" } }),
      ).toEqual(validImage);
    });

    it("retorna null quando `image` é null", () => {
      expect(parseHomeImageResponse({ image: null })).toBeNull();
    });

    it("retorna null quando falta um campo", () => {
      const withoutUrl = {
        workId: validImage.workId,
        imageId: validImage.imageId,
        alt: validImage.alt,
      };

      expect(parseHomeImageResponse({ image: withoutUrl })).toBeNull();
    });

    it("retorna null quando um campo não é string", () => {
      expect(
        parseHomeImageResponse({ image: { ...validImage, workId: 42 } }),
      ).toBeNull();
    });

    it.each([null, undefined, "texto", 1, [], {}])(
      "retorna null para corpo não conforme (%o)",
      (value) => {
        expect(parseHomeImageResponse(value)).toBeNull();
      },
    );
  });
});
