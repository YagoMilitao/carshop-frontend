import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WorkImage } from "@/lib/api/works";
import { WorkGallery } from "./work-gallery";

const images: WorkImage[] = [
  {
    id: "img-2",
    url: "https://res.cloudinary.com/demo/img-2.jpg",
    publicId: "img-2",
    alt: "Segunda imagem",
    isCover: false,
    order: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "img-1",
    url: "https://res.cloudinary.com/demo/img-1.jpg",
    publicId: "img-1",
    alt: "Primeira imagem",
    isCover: true,
    order: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "img-3",
    url: "https://res.cloudinary.com/demo/img-3.jpg",
    publicId: "img-3",
    alt: "Terceira imagem",
    isCover: false,
    order: 2,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
];

describe("WorkGallery", () => {
  it("não renderiza nada quando não há imagens", () => {
    const { container } = render(
      <WorkGallery images={[]} fallbackAlt="Fusca 1978" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza uma miniatura por imagem, ordenadas por order", () => {
    render(<WorkGallery images={images} fallbackAlt="Fusca 1978" />);

    const buttons = screen.getAllByRole("button", { name: /Ampliar imagem/ });
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAccessibleName("Ampliar imagem 1 de 3");
    expect(buttons[1]).toHaveAccessibleName("Ampliar imagem 2 de 3");
    expect(buttons[2]).toHaveAccessibleName("Ampliar imagem 3 de 3");

    // Ordem visual deve seguir `order` (img-1 = order 0, img-2 = order 1, img-3 = order 2)
    expect(screen.getByAltText("Primeira imagem")).toBeInTheDocument();
    expect(screen.getByAltText("Segunda imagem")).toBeInTheDocument();
    expect(screen.getByAltText("Terceira imagem")).toBeInTheDocument();

    // Lightbox começa fechado.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicar em uma miniatura abre o lightbox na imagem correspondente", async () => {
    const user = userEvent.setup();
    render(<WorkGallery images={images} fallbackAlt="Fusca 1978" />);

    await user.click(
      screen.getByRole("button", { name: "Ampliar imagem 2 de 3" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // A imagem 2 do grid ordenado (order 1) é "Segunda imagem".
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(
      within(dialog).getByAltText("Segunda imagem"),
    ).toBeInTheDocument();
  });

  it("navegar pelo lightbox atualiza o estado de seleção do WorkGallery", async () => {
    const user = userEvent.setup();
    render(<WorkGallery images={images} fallbackAlt="Fusca 1978" />);

    await user.click(
      screen.getByRole("button", { name: "Ampliar imagem 1 de 3" }),
    );
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima imagem" }));

    const liveRegion = screen.getByText(/2 \/ 3/);
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveTextContent("2 / 3: Segunda imagem");
    expect(screen.getByAltText("Segunda imagem")).toBeInTheDocument();
  });

  it("fechar o lightbox (Esc) limpa a seleção e devolve o grid ao estado inicial", async () => {
    const user = userEvent.setup();
    render(<WorkGallery images={images} fallbackAlt="Fusca 1978" />);

    await user.click(
      screen.getByRole("button", { name: "Ampliar imagem 1 de 3" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("devolve o foco à miniatura que abriu o lightbox ao fechar", async () => {
    const user = userEvent.setup();
    render(<WorkGallery images={images} fallbackAlt="Fusca 1978" />);

    const trigger = screen.getByRole("button", {
      name: "Ampliar imagem 2 de 3",
    });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });
});
