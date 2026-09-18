import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { Container } from "./container";

describe("Container", () => {
  it("renderiza um <div> por padrão contendo os children", () => {
    render(<Container>conteúdo</Container>);

    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("aplica a classe container-page e os gutters responsivos por padrão", () => {
    render(<Container data-testid="container">conteúdo</Container>);

    expect(screen.getByTestId("container")).toHaveClass(
      "container-page",
      "px-5",
      "sm:px-8",
      "lg:px-16",
      "xl:px-20",
    );
  });

  it("aplica a classe container-reading quando variant='reading'", () => {
    render(
      <Container variant="reading" data-testid="container">
        conteúdo
      </Container>,
    );

    const element = screen.getByTestId("container");
    expect(element).toHaveClass("container-reading");
    expect(element).not.toHaveClass("container-page");
  });

  it("renderiza o elemento definido via prop as", () => {
    render(
      <Container as="main" data-testid="container">
        conteúdo
      </Container>,
    );

    expect(screen.getByTestId("container").tagName).toBe("MAIN");
  });

  it("aceita e repassa as props do componente definido via as", () => {
    render(
      <Container as={Link} href="/portfolio">
        Ver portfólio
      </Container>,
    );

    expect(screen.getByRole("link", { name: "Ver portfólio" })).toHaveAttribute(
      "href",
      "/portfolio",
    );
  });

  it("mescla className customizado sem sobrescrever as classes base", () => {
    render(
      <Container className="custom-class" data-testid="container">
        conteúdo
      </Container>,
    );

    expect(screen.getByTestId("container")).toHaveClass("container-page", "custom-class");
  });
});
