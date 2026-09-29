import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./_components/home-image-settings", () => ({
  HomeImageSettings: () => <div data-testid="home-image-settings" />,
}));

import AdminHomeImagePage, { metadata } from "./page";

describe("AdminHomeImagePage", () => {
  it("nunca é indexável (robots noindex, nofollow)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renderiza o h1, a descrição e o painel de configuração", () => {
    const { container } = render(<AdminHomeImagePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Imagem da Home" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Escolha a foto principal exibida no topo da página inicial. Apenas imagens de trabalhos publicados podem ser usadas.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("home-image-settings")).toBeInTheDocument();
    expect(container.querySelector("main")).toBeNull();
  });
});
