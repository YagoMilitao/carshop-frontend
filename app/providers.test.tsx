import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Providers } from "./providers";

describe("Providers", () => {
  it("renderiza os children dentro do QueryClientProvider", () => {
    render(
      <Providers>
        <p>conteúdo filho</p>
      </Providers>,
    );

    expect(screen.getByText("conteúdo filho")).toBeInTheDocument();
  });
});
