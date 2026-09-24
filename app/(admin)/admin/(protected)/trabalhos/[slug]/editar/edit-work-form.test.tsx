import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
      isFetching: true,
      isPending: true,
    });

    render(<EditWorkForm slug="restauracao-fusca" />);

    expect(screen.getByText("Carregando trabalho...")).toBeInTheDocument();
  });

  it("mantém o loading durante refetch quando o cache ainda não contém o work", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isFetching: true,
      isPending: false,
    });

    render(<EditWorkForm slug="trabalho-criado-em-outra-sessao" />);

    expect(screen.getByText("Carregando trabalho...")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum trabalho encontrado para este identificador."),
    ).not.toBeInTheDocument();
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

  it("mantém o erro visível e mostra 'Tentando novamente...' desabilitado enquanto refaz o fetch", async () => {
    const refetchMock = vi.fn();
    getApiErrorMessageMock.mockReturnValue("Ocorreu um erro inesperado. Tente novamente.");
    useQueryMock.mockReturnValue({
      data: undefined,
      error: { response: { status: 500 } },
      isFetching: false,
      isPending: false,
      refetch: refetchMock,
    });
    const user = userEvent.setup();

    const { rerender } = render(<EditWorkForm slug="restauracao-fusca" />);

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetchMock).toHaveBeenCalledTimes(1);

    useQueryMock.mockReturnValue({
      data: undefined,
      error: { response: { status: 500 } },
      isFetching: true,
      isPending: false,
      refetch: refetchMock,
    });
    rerender(<EditWorkForm slug="restauracao-fusca" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
    expect(
      screen.getByRole("button", { name: "Tentando novamente..." }),
    ).toBeDisabled();
    expect(screen.queryByText("Carregando trabalho...")).not.toBeInTheDocument();
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

  it("loading: exibe o AdminLoadingState sem manter aria-busy até o unmount", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isFetching: true,
      isPending: true,
    });

    render(<EditWorkForm slug="restauracao-fusca" />);

    const status = screen.getByRole("status");
    expect(status).not.toHaveAttribute("aria-busy");
    expect(status).toHaveTextContent("Carregando trabalho...");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
  });

  it("erro: 'Tentar novamente' chama o refetch da query, sem exibir o formulário nem o not-found", async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined);
    getApiErrorMessageMock.mockReturnValue("Falha ao carregar.");
    useQueryMock.mockReturnValue({
      data: undefined,
      error: new Error("boom"),
      isFetching: false,
      isPending: false,
      refetch: refetchMock,
    });
    const user = userEvent.setup();

    render(<EditWorkForm slug="restauracao-fusca" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum trabalho encontrado para este identificador."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("not-found: estado vazio distinto do erro (sem role=alert nem retry)", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isFetching: false,
      isPending: false,
    });

    render(<EditWorkForm slug="inexistente" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();
  });

  it("formulário: 'Cancelar' aponta para /admin/trabalhos e o status usa NativeSelect com Draft/Published", () => {
    useQueryMock.mockReturnValue({
      data: { ...work, status: "published" },
      error: null,
      isPending: false,
    });

    render(<EditWorkForm slug="restauracao-fusca" />);

    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/admin/trabalhos",
    );

    const statusSelect = screen.getByRole("combobox", { name: "Status" });
    expect(statusSelect).toHaveAttribute("data-slot", "native-select");
    expect(statusSelect).toHaveValue("published");
    const options = within(statusSelect).getAllByRole("option");
    expect(options.map((option) => [option.getAttribute("value"), option.textContent])).toEqual([
      ["draft", "Draft"],
      ["published", "Published"],
    ]);
    expect(screen.queryByText("published")).not.toBeInTheDocument();
    expect(screen.queryByText("draft")).not.toBeInTheDocument();

    const description = screen.getByLabelText("Descrição");
    expect(description.tagName).toBe("TEXTAREA");
    expect(description).toHaveAttribute("data-slot", "textarea");
    expect(description).toHaveAttribute("aria-invalid", "false");
    expect(description).toHaveClass("min-h-24");
  });

  describe("submit", () => {
    beforeEach(() => {
      useQueryMock.mockReturnValue({
        data: work,
        error: null,
        isPending: false,
      });
    });

    it("valida campos obrigatórios pelo submit antes de chamar a API", async () => {
      const user = userEvent.setup();

      render(<EditWorkForm slug="restauracao-fusca" />);

      const titleInput = screen.getByLabelText("Título");
      await user.clear(titleInput);
      await user.click(screen.getByRole("button", { name: "Salvar" }));

      expect(await screen.findByText("Informe o título.")).toBeInTheDocument();
      expect(titleInput).toHaveAttribute("aria-invalid", "true");
      expect(updateWorkMock).not.toHaveBeenCalled();
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
