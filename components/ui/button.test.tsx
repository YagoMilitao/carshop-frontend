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
});
