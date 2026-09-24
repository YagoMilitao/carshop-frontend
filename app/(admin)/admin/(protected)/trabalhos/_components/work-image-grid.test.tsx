import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { WorkImage } from "@/lib/api/works";

import {
  WorkImageGrid,
  getWorkImageLabel,
  sortWorkImages,
} from "./work-image-grid";

const WORK_TITLE = "Restauração Fusca";

function createImage(overrides: Partial<WorkImage> & Pick<WorkImage, "id">) {
  return {
    url: `https://res.cloudinary.com/demo/${overrides.id}.jpg`,
    publicId: overrides.id,
    alt: "",
    isCover: false,
    order: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  } satisfies WorkImage;
}

const coverImage = createImage({
  id: "img-cover",
  alt: "Banco restaurado",
  isCover: true,
  order: 2,
});
const firstImage = createImage({ id: "img-first", alt: "Painel", order: 0 });
const noAltImage = createImage({ id: "img-no-alt", alt: "", order: 1 });

describe("getWorkImageLabel", () => {
  it("usa o alt da imagem quando presente", () => {
    expect(getWorkImageLabel(coverImage, 0, WORK_TITLE)).toBe(
      "Banco restaurado",
    );
  });

  it("usa um fallback descritivo com posição e título quando o alt é vazio", () => {
    expect(getWorkImageLabel(noAltImage, 1, WORK_TITLE)).toBe(
      "Imagem 2 do trabalho Restauração Fusca",
    );
  });
});

describe("sortWorkImages", () => {
  it("ordena por order sem mutar o array original", () => {
    const original = [coverImage, firstImage, noAltImage];

    const sorted = sortWorkImages(original);

    expect(sorted.map((image) => image.id)).toEqual([
      "img-first",
      "img-no-alt",
      "img-cover",
    ]);
    expect(original.map((image) => image.id)).toEqual([
      "img-cover",
      "img-first",
      "img-no-alt",
    ]);
  });
});

describe("WorkImageGrid", () => {
  it("exibe estado vazio sem lista quando não há imagens", () => {
    render(
      <WorkImageGrid
        images={[]}
        workTitle={WORK_TITLE}
        disabled={false}
        onRequestRemove={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Nenhuma imagem cadastrada para este trabalho."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Remover imagem/ }),
    ).not.toBeInTheDocument();
  });

  it("renderiza as miniaturas ordenadas por order com alt e fallback", () => {
    render(
      <WorkImageGrid
        images={[coverImage, firstImage, noAltImage]}
        workTitle={WORK_TITLE}
        disabled={false}
        onRequestRemove={vi.fn()}
      />,
    );

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const alts = items.map((item) =>
      within(item).getByRole("img").getAttribute("alt"),
    );
    expect(alts).toEqual([
      "Painel",
      "Imagem 2 do trabalho Restauração Fusca",
      "Banco restaurado",
    ]);
  });

  it("exibe o Badge 'Capa' apenas na imagem de capa", () => {
    render(
      <WorkImageGrid
        images={[coverImage, firstImage]}
        workTitle={WORK_TITLE}
        disabled={false}
        onRequestRemove={vi.fn()}
      />,
    );

    const badges = screen.getAllByText("Capa");
    expect(badges).toHaveLength(1);

    const itemsWithCover = screen
      .getAllByRole("listitem")
      .filter((item) => within(item).queryByText("Capa"));
    expect(itemsWithCover).toHaveLength(1);
    for (const item of itemsWithCover) {
      expect(within(item).getByRole("img")).toHaveAttribute(
        "alt",
        "Banco restaurado",
      );
    }
  });

  it("gera um aria-label único por botão de remoção", () => {
    render(
      <WorkImageGrid
        images={[coverImage, firstImage, noAltImage]}
        workTitle={WORK_TITLE}
        disabled={false}
        onRequestRemove={vi.fn()}
      />,
    );

    const labels = screen
      .getAllByRole("button", { name: /^Remover imagem: / })
      .map((button) => button.getAttribute("aria-label"));

    expect(labels).toEqual([
      "Remover imagem: Painel",
      "Remover imagem: Imagem 2 do trabalho Restauração Fusca",
      "Remover imagem: Banco restaurado",
    ]);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("chama onRequestRemove com a imagem clicada e o botão acionado", async () => {
    const onRequestRemove = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkImageGrid
        images={[coverImage, firstImage]}
        workTitle={WORK_TITLE}
        disabled={false}
        onRequestRemove={onRequestRemove}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "Remover imagem: Banco restaurado",
    });
    await user.click(removeButton);

    expect(onRequestRemove).toHaveBeenCalledTimes(1);
    expect(onRequestRemove).toHaveBeenCalledWith(coverImage, removeButton);
  });

  it("desabilita todos os botões de remoção quando disabled é true", async () => {
    const onRequestRemove = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkImageGrid
        images={[coverImage, firstImage]}
        workTitle={WORK_TITLE}
        disabled
        onRequestRemove={onRequestRemove}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /^Remover imagem/ });
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }

    await user.click(buttons[0]);
    expect(onRequestRemove).not.toHaveBeenCalled();
  });
});
