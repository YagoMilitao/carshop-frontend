import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageSection } from "./page-section";

describe("PageSection", () => {
  it("renderiza um elemento <section> por padrão contendo os children", () => {
    render(<PageSection>conteúdo</PageSection>);

    const section = screen.getByText("conteúdo").closest("section");
    expect(section).toBeInTheDocument();
  });

  it("aplica o spacing 'standard' por padrão", () => {
    render(<PageSection data-testid="section">conteúdo</PageSection>);

    expect(screen.getByTestId("section")).toHaveClass("py-16", "lg:py-28");
  });

  it("aplica o spacing 'compact' quando informado", () => {
    render(
      <PageSection spacing="compact" data-testid="section">
        conteúdo
      </PageSection>,
    );

    expect(screen.getByTestId("section")).toHaveClass("py-12", "lg:py-16");
  });

  it("aplica o spacing 'editorial' quando informado", () => {
    render(
      <PageSection spacing="editorial" data-testid="section">
        conteúdo
      </PageSection>,
    );

    expect(screen.getByTestId("section")).toHaveClass("py-20", "lg:py-36");
  });

  it("envolve os children em um Container com a classe container-page por padrão", () => {
    render(
      <PageSection data-testid="section">
        <p data-testid="child">conteúdo</p>
      </PageSection>,
    );

    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("container-page");
  });

  it("envolve os children em um Container com a classe container-reading quando container='reading'", () => {
    render(
      <PageSection container="reading">
        <p data-testid="child">conteúdo</p>
      </PageSection>,
    );

    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("container-reading");
  });

  it("renderiza os children diretamente (full-bleed) quando container='none'", () => {
    render(
      <PageSection container="none" data-testid="section">
        <p data-testid="child">conteúdo</p>
      </PageSection>,
    );

    const child = screen.getByTestId("child");
    expect(child.parentElement).toBe(screen.getByTestId("section"));
  });

  it("renderiza o elemento definido via prop as", () => {
    render(
      <PageSection as="div" data-testid="section">
        conteúdo
      </PageSection>,
    );

    expect(screen.getByTestId("section").tagName).toBe("DIV");
  });
});
