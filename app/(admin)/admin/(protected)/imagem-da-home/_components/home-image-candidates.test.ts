import { describe, expect, it } from "vitest";

import {
  findHomeImageCandidate,
  isSameHomeImageRef,
  selectHomeImageCandidates,
} from "./home-image-candidates";
import { makeImage, makeWork } from "./home-image.test-helpers";

describe("selectHomeImageCandidates", () => {
  it("mantém apenas works publicados, não removidos e com imagens", () => {
    const works = [
      makeWork("published"),
      makeWork("draft", { status: "draft" }),
      makeWork("deleted", { deletedAt: "2024-02-01T00:00:00.000Z" }),
      makeWork("no-images", { images: [] }),
    ];

    expect(selectHomeImageCandidates(works).map((group) => group.workId)).toEqual(
      ["published"],
    );
  });

  it("preserva a ordem da API e mapeia id/título", () => {
    const groups = selectHomeImageCandidates([
      makeWork("b", { title: "Bancos" }),
      makeWork("a", { title: "Acabamento" }),
    ]);

    expect(groups.map(({ workId, workTitle }) => ({ workId, workTitle }))).toEqual(
      [
        { workId: "b", workTitle: "Bancos" },
        { workId: "a", workTitle: "Acabamento" },
      ],
    );
  });

  it("ordena as imagens de cada work por `order`", () => {
    const [group] = selectHomeImageCandidates([
      makeWork("w", {
        images: [makeImage("i3", 2), makeImage("i1", 0), makeImage("i2", 1)],
      }),
    ]);

    expect(group.images.map((image) => image.id)).toEqual(["i1", "i2", "i3"]);
  });

  it("retorna lista vazia quando nada é elegível", () => {
    expect(selectHomeImageCandidates([])).toEqual([]);
  });
});

describe("isSameHomeImageRef", () => {
  it("compara por workId + imageId", () => {
    expect(
      isSameHomeImageRef(
        { workId: "w", imageId: "i" },
        { workId: "w", imageId: "i" },
      ),
    ).toBe(true);
    expect(
      isSameHomeImageRef(
        { workId: "w", imageId: "i" },
        { workId: "w", imageId: "j" },
      ),
    ).toBe(false);
    expect(
      isSameHomeImageRef(
        { workId: "w", imageId: "i" },
        { workId: "x", imageId: "i" },
      ),
    ).toBe(false);
  });

  it("nunca usa a URL como identidade", () => {
    const sameUrl = "https://res.cloudinary.com/demo/image/upload/x.jpg";
    // `HomeImage` completos (com URL) também são aceitos estruturalmente.
    const active = { workId: "w", imageId: "i", url: sameUrl, alt: "" };
    const otherImageSameUrl = { workId: "w", imageId: "j", url: sameUrl, alt: "" };
    const sameIdsOtherUrl = {
      workId: "w",
      imageId: "i",
      url: "https://outra.example.com/y.jpg",
      alt: "",
    };

    expect(isSameHomeImageRef(active, otherImageSameUrl)).toBe(false);
    expect(isSameHomeImageRef(active, sameIdsOtherUrl)).toBe(true);
  });

  it("é false quando algum lado está ausente", () => {
    expect(isSameHomeImageRef(null, { workId: "w", imageId: "i" })).toBe(false);
    expect(isSameHomeImageRef({ workId: "w", imageId: "i" }, undefined)).toBe(
      false,
    );
    expect(isSameHomeImageRef(null, null)).toBe(false);
  });
});

describe("findHomeImageCandidate", () => {
  const groups = selectHomeImageCandidates([
    makeWork("w", {
      images: [makeImage("i1", 0), makeImage("i2", 1)],
    }),
  ]);

  it("localiza grupo, imagem e posição", () => {
    const match = findHomeImageCandidate(groups, { workId: "w", imageId: "i2" });

    expect(match?.group.workId).toBe("w");
    expect(match?.image.id).toBe("i2");
    expect(match?.index).toBe(1);
  });

  it("retorna null quando a referência não está mais entre as candidatas", () => {
    expect(
      findHomeImageCandidate(groups, { workId: "w", imageId: "sumiu" }),
    ).toBeNull();
    expect(
      findHomeImageCandidate(groups, { workId: "outro", imageId: "i1" }),
    ).toBeNull();
    expect(findHomeImageCandidate(undefined, { workId: "w", imageId: "i1" })).toBeNull();
    expect(findHomeImageCandidate(groups, null)).toBeNull();
  });
});
