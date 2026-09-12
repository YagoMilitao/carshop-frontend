import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { WorkImage } from "@/lib/api/works";
import { WorkImageThumb } from "./work-image-thumb";

const baseImage: WorkImage = {
  id: "img-1",
  url: "https://res.cloudinary.com/demo/img-1.jpg",
  publicId: "img-1",
  alt: "Banco restaurado",
  isCover: true,
  order: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

describe("WorkImageThumb", () => {
  it("renderiza a imagem com src e alt do WorkImage", () => {
    render(
      <WorkImageThumb
        image={baseImage}
        fallbackAlt="Fusca 1978"
        sizes="50vw"
      />,
    );

    const img = screen.getByAltText("Banco restaurado");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("img-1.jpg"));
  });

  it("usa fallbackAlt quando image.alt vem vazio", () => {
    render(
      <WorkImageThumb
        image={{ ...baseImage, alt: "" }}
        fallbackAlt="Fusca 1978"
        sizes="50vw"
      />,
    );

    expect(screen.getByAltText("Fusca 1978")).toBeInTheDocument();
  });

  it("não define priority por padrão (lazy loading)", () => {
    render(
      <WorkImageThumb
        image={baseImage}
        fallbackAlt="Fusca 1978"
        sizes="50vw"
      />,
    );

    const img = screen.getByAltText("Banco restaurado");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).not.toHaveAttribute("fetchpriority", "high");
  });

  it("aplica priority quando explicitamente solicitado", () => {
    render(
      <WorkImageThumb
        image={baseImage}
        fallbackAlt="Fusca 1978"
        sizes="50vw"
        priority
      />,
    );

    const img = screen.getByAltText("Banco restaurado");
    expect(img).not.toHaveAttribute("loading", "lazy");
  });

  it("mescla className extra no container", () => {
    const { container } = render(
      <WorkImageThumb
        image={baseImage}
        fallbackAlt="Fusca 1978"
        sizes="50vw"
        className="size-16 shrink-0"
      />,
    );

    expect(container.firstChild).toHaveClass("size-16", "shrink-0");
  });
});
