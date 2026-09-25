import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renderiza com variant/size padrão e responde a clique", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Salvar</Button>);

    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
    expect(button.className).toContain(
      "hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_10%)]",
    );

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("aplica variant/size customizados e mescla className extra", () => {
    render(
      <Button variant="destructive" size="lg" className="w-full">
        Excluir
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Excluir" });
    expect(button).toHaveAttribute("data-variant", "destructive");
    expect(button).toHaveAttribute("data-size", "lg");
    expect(button.className).toContain("w-full");
  });

  it("preserva text-button junto da cor de texto em variants com cor", () => {
    render(
      <>
        <Button>Padrão</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="destructive">Destrutivo</Button>
      </>,
    );

    for (const name of ["Padrão", "Secundário", "Destrutivo"]) {
      expect(screen.getByRole("button", { name }).className.split(" ")).toContain(
        "text-button",
      );
    }
    const primary = screen.getByRole("button", { name: "Padrão" });
    expect(primary.className.split(" ")).toContain("text-primary-foreground");
  });

  it("size xs substitui text-button por text-xs", () => {
    render(<Button size="xs">Mini</Button>);

    const classes = screen.getByRole("button", { name: "Mini" }).className.split(" ");
    expect(classes).toContain("text-xs");
    expect(classes).not.toContain("text-button");
    expect(classes).toContain("text-primary-foreground");
    expect(classes).toContain("font-bold");
  });

  it("size sm substitui text-button por text-[0.8rem] mantendo peso bold", () => {
    render(
      <Button size="sm" variant="outline">
        Pequeno
      </Button>,
    );

    const classes = screen.getByRole("button", { name: "Pequeno" }).className.split(" ");
    expect(classes).toContain("text-[0.8rem]");
    expect(classes).not.toContain("text-button");
    expect(classes).toContain("font-bold");
  });

  it("não dispara onClick quando disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={onClick}>
        Indisponível
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Indisponível" });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("com asChild, renderiza o elemento filho em vez de <button>", () => {
    render(
      <Button asChild>
        <a href="/veiculos">Ver veículos</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ver veículos" });
    expect(link).toHaveAttribute("href", "/veiculos");
    expect(link).toHaveAttribute("data-slot", "button");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("usa o anel de foco canônico com offset e outline-hidden (A-02)", () => {
    render(<Button>Foco</Button>);

    const button = screen.getByRole("button", { name: "Foco" });
    expect(button).toHaveClass(
      "outline-hidden",
      "focus-visible:ring-3",
      "focus-visible:ring-focus-ring",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-background",
    );
    const classes = button.className.split(" ");
    expect(classes).not.toContain("outline-none");
    expect(classes).not.toContain("focus-visible:ring-ring/50");
  });

  it("variant destructive não sobrescreve o anel de foco canônico (A-02)", () => {
    render(<Button variant="destructive">Remover</Button>);

    const button = screen.getByRole("button", { name: "Remover" });
    expect(button).toHaveClass("focus-visible:ring-focus-ring");
    for (const token of button.className.split(" ")) {
      expect(token).not.toMatch(/^(dark:)?focus-visible:(ring|border)-destructive/);
    }
  });
});
