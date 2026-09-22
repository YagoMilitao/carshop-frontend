import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Work } from "@/lib/api/works";

const useQueryMock = vi.fn();
const findAdminWorkBySlugMock = vi.fn();
const getApiErrorMessageMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => useQueryMock(options),
}));

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  getAdminWorks: vi.fn(),
  findAdminWorkBySlug: (works: Work[], slug: string) =>
    findAdminWorkBySlugMock(works, slug),
}));

vi.mock("@/lib/api/auth.client", () => ({
  getApiErrorMessage: (error: unknown) => getApiErrorMessageMock(error),
}));

import { EditWorkForm } from "./edit-work-form";

const work: Work = {
  id: "work-1",
  slug: "restauracao-fusca",
  title: "Restauração Fusca",
  description: "Descrição completa do serviço.",
  category: "Estofamento",
  tags: ["fusca", "restauracao"],
  images: [],
  status: "draft",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

describe("EditWorkForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe mensagem de carregamento enquanto isPending", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
    });

    render(<EditWorkForm slug="restauracao-fusca" />);

    expect(screen.getByText("Carregando trabalho...")).toBeInTheDocument();
  });

  it("exibe erro de fetch com role=alert usando getApiErrorMessage", () => {
    const apiError = { response: { status: 500 } };
    getApiErrorMessageMock.mockReturnValue("Ocorreu um erro inesperado. Tente novamente.");
    useQueryMock.mockReturnValue({
      data: undefined,
      error: apiError,
      isPending: false,
    });

    render(<EditWorkForm slug="restauracao-fusca" />);

    expect(getApiErrorMessageMock).toHaveBeenCalledWith(apiError);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });

  it("exibe 404 inline com link de retorno quando o work não é encontrado", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
    });

    render(<EditWorkForm slug="inexistente" />);

    expect(
      screen.getByText("Nenhum trabalho encontrado para este identificador."),
    ).toBeInTheDocument();
    const backLink = screen.getByRole("link", { name: "Voltar para Trabalhos" });
    expect(backLink).toHaveAttribute("href", "/admin/trabalhos");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("pré-preenche o formulário com os dados do work (incluindo rascunho) e mantém o botão Salvar desabilitado", () => {
    useQueryMock.mockReturnValue({
      data: work,
      error: null,
      isPending: false,
    });

    render(<EditWorkForm slug="restauracao-fusca" />);

    expect(screen.getByLabelText("Identificador da URL")).toHaveValue(
      "restauracao-fusca",
    );
    expect(screen.getByLabelText("Título")).toHaveValue("Restauração Fusca");
    expect(screen.getByLabelText("Descrição")).toHaveValue(
      "Descrição completa do serviço.",
    );
    expect(screen.getByLabelText("Categoria")).toHaveValue("Estofamento");
    expect(screen.getByLabelText("Tags (separadas por vírgula)")).toHaveValue(
      "fusca, restauracao",
    );
    expect(screen.getByLabelText("Status")).toHaveValue("draft");

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute("aria-disabled", "true");
    expect(saveButton).toHaveAttribute("title", "Disponível em breve");
  });
});
