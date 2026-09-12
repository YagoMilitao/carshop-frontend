import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RefObject } from "react";
import type { WorkImage } from "@/lib/api/works";
import { GalleryLightbox } from "./gallery-lightbox";

const restoreFocusRef: RefObject<HTMLElement | null> = { current: null };

const images: WorkImage[] = [
  {
    id: "img-1",
    url: "https://res.cloudinary.com/demo/img-1.jpg",
    publicId: "img-1",
    alt: "Banco dianteiro",
    isCover: true,
    order: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "img-2",
    url: "https://res.cloudinary.com/demo/img-2.jpg",
    publicId: "img-2",
    alt: "Banco traseiro",
    isCover: false,
    order: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "img-3",
    url: "https://res.cloudinary.com/demo/img-3.jpg",
    publicId: "img-3",
    alt: "",
    isCover: false,
    order: 2,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
];

describe("GalleryLightbox", () => {
  it("não monta a imagem quando selectedIndex é null (fechado)", () => {
    render(
      <GalleryLightbox
        images={images}
        selectedIndex={null}
        onOpenChange={vi.fn()}
        onNavigate={vi.fn()}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Banco dianteiro")).not.toBeInTheDocument();
  });

  it("abre e exibe a imagem correspondente ao selectedIndex, com role/aria do Dialog", () => {
    render(
      <GalleryLightbox
        images={images}
        selectedIndex={0}
        onOpenChange={vi.fn()}
        onNavigate={vi.fn()}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByAltText("Banco dianteiro")).toBeInTheDocument();
    expect(
      screen.getByText("Imagem 1 de 3: Banco dianteiro"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("usa fallbackAlt no título e na imagem quando alt vem vazio", () => {
    render(
      <GalleryLightbox
        images={images}
        selectedIndex={2}
        onOpenChange={vi.fn()}
        onNavigate={vi.fn()}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    expect(screen.getAllByAltText("Fusca 1978")[0]).toBeInTheDocument();
    expect(
      screen.getByText("Imagem 3 de 3: Fusca 1978"),
    ).toBeInTheDocument();
  });

  it("navega para a próxima imagem via botão, com wrap-around circular", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <GalleryLightbox
        images={images}
        selectedIndex={2}
        onOpenChange={vi.fn()}
        onNavigate={onNavigate}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Próxima imagem" }));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("navega para a imagem anterior via botão, com wrap-around circular", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <GalleryLightbox
        images={images}
        selectedIndex={0}
        onOpenChange={vi.fn()}
        onNavigate={onNavigate}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Imagem anterior" }));
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  it("navega via teclado (ArrowRight/ArrowLeft)", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <GalleryLightbox
        images={images}
        selectedIndex={1}
        onOpenChange={vi.fn()}
        onNavigate={onNavigate}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    await user.keyboard("{ArrowRight}");
    expect(onNavigate).toHaveBeenCalledWith(2);

    await user.keyboard("{ArrowLeft}");
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("fecha via Esc chamando onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <GalleryLightbox
        images={images}
        selectedIndex={0}
        onOpenChange={onOpenChange}
        onNavigate={vi.fn()}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("anuncia a posição e a descrição da imagem atual em uma região aria-live", () => {
    render(
      <GalleryLightbox
        images={images}
        selectedIndex={1}
        onOpenChange={vi.fn()}
        onNavigate={vi.fn()}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    const liveRegion = screen.getByText(/2 \/ 3/);
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toHaveTextContent("2 / 3: Banco traseiro");
  });

  it("não exibe controles de navegação nem contador quando há apenas uma imagem", () => {
    render(
      <GalleryLightbox
        images={[images[0]]}
        selectedIndex={0}
        onOpenChange={vi.fn()}
        onNavigate={vi.fn()}
        fallbackAlt="Fusca 1978"
        restoreFocusRef={restoreFocusRef}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Próxima imagem" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Imagem anterior" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
  });
});
