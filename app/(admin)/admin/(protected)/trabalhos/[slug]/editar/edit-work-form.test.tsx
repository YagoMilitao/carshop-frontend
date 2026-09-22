import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Work } from "@/lib/api/works";

const useQueryMock = vi.fn();
const findAdminWorkBySlugMock = vi.fn();
const getApiErrorMessageMock = vi.fn();
const updateWorkMock = vi.fn();
const revalidateWorksTagMock = vi.fn();
const invalidateQueriesMock = vi.fn();
const routerPushMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => useQueryMock(options),
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  getAdminWorks: vi.fn(),
  findAdminWorkBySlug: (works: Work[], slug: string) =>
    findAdminWorkBySlugMock(works, slug),
  updateWork: (workId: string, payload: unknown) =>
    updateWorkMock(workId, payload),
}));

vi.mock("@/lib/api/auth.client", () => ({
  getApiErrorMessage: (error: unknown) => getApiErrorMessageMock(error),
}));

vi.mock("@/app/(admin)/admin/actions", () => ({
  revalidateWorksTag: () => revalidateWorksTagMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
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
    invalidateQueriesMock.mockResolvedValue(undefined);
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

  it("pré-preenche o formulário com os dados do work (incluindo rascunho) e mantém o botão Salvar habilitado", () => {
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
    expect(saveButton).toBeEnabled();
    expect(saveButton).not.toHaveAttribute("aria-disabled");
    expect(saveButton).not.toHaveAttribute("title");
  });

  describe("submit", () => {
    beforeEach(() => {
      useQueryMock.mockReturnValue({
        data: work,
        error: null,
        isPending: false,
      });
    });

    it("atualiza o trabalho com work.id e o payload do formulário, invalida o cache e navega para /admin/trabalhos", async () => {
      const user = userEvent.setup();
      updateWorkMock.mockResolvedValue({ ...work });
      revalidateWorksTagMock.mockResolvedValue(undefined);

      render(<EditWorkForm slug="restauracao-fusca" />);

      await user.click(screen.getByRole("button", { name: "Salvar" }));

      await waitFor(() =>
        expect(updateWorkMock).toHaveBeenCalledWith("work-1", {
          slug: "restauracao-fusca",
          title: "Restauração Fusca",
          description: "Descrição completa do serviço.",
          category: "Estofamento",
          tags: ["fusca", "restauracao"],
          status: "draft",
        }),
      );

      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ["admin", "works"],
        refetchType: "none",
      });
      expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Trabalho atualizado com sucesso.",
      );
      expect(routerPushMock).toHaveBeenCalledWith("/admin/trabalhos");
    });

    it.each([400, 404, 409])(
      "exibe a mensagem de erro com role=alert e não navega quando a API retorna %s",
      async (status) => {
        const user = userEvent.setup();
        const apiError = { response: { status } };
        updateWorkMock.mockRejectedValue(apiError);
        getApiErrorMessageMock.mockReturnValue("Não foi possível salvar as alterações.");

        render(<EditWorkForm slug="restauracao-fusca" />);

        await user.click(screen.getByRole("button", { name: "Salvar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Não foi possível salvar as alterações.",
        );
        expect(getApiErrorMessageMock).toHaveBeenCalledWith(apiError);
        expect(routerPushMock).not.toHaveBeenCalled();
        expect(revalidateWorksTagMock).not.toHaveBeenCalled();
      },
    );
  });
});
