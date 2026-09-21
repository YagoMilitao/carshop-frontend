import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createWorkMock = vi.fn();
const revalidateWorksTagMock = vi.fn();
const invalidateQueriesMock = vi.fn();
const routerPushMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  createWork: (payload: unknown) => createWorkMock(payload),
}));

vi.mock("@/app/(admin)/admin/actions", () => ({
  revalidateWorksTag: () => revalidateWorksTagMock(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

import { CreateWorkForm } from "./create-work-form";

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Slug"), " restauracao-fusca ");
  await user.type(screen.getByLabelText("Título"), " Restauração Fusca ");
  await user.type(
    screen.getByLabelText("Descrição"),
    " Descrição completa do serviço. ",
  );
  await user.type(screen.getByLabelText("Categoria"), " Estofamento ");
  await user.type(
    screen.getByLabelText("Tags (separadas por vírgula)"),
    "fusca, restauracao",
  );
}

async function submitValidForm() {
  const user = userEvent.setup();

  render(<CreateWorkForm />);
  await fillValidForm(user);
  await user.click(screen.getByRole("button", { name: "Criar trabalho" }));
}

function createAxiosError(
  status: number,
  statusText: string,
  data: { message?: string; stack?: string },
) {
  const config: InternalAxiosRequestConfig = {
    headers: new AxiosHeaders(),
  };

  return new AxiosError(
    statusText,
    status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
    config,
    undefined,
    {
      status,
      statusText,
      headers: new AxiosHeaders(),
      config,
      data,
    },
  );
}

describe("CreateWorkForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateQueriesMock.mockResolvedValue(undefined);
  });

  it("não submete e exibe erros de validação quando campos obrigatórios estão vazios", async () => {
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(await screen.findByText("Informe o título.")).toBeInTheDocument();
    expect(screen.getByText("Informe o slug.")).toBeInTheDocument();
    expect(screen.getByText("Informe a descrição.")).toBeInTheDocument();
    expect(screen.getByText("Informe a categoria.")).toBeInTheDocument();
    expect(screen.getByText("Informe ao menos uma tag.")).toBeInTheDocument();

    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(createWorkMock).not.toHaveBeenCalled();
  });

  it("não submete campos obrigatórios preenchidos apenas com espaços", async () => {
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Tags (separadas por vírgula)"), {
      target: { value: "   " },
    });
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(await screen.findByText("Informe o slug.")).toBeInTheDocument();
    expect(screen.getByText("Informe o título.")).toBeInTheDocument();
    expect(screen.getByText("Informe a descrição.")).toBeInTheDocument();
    expect(screen.getByText("Informe a categoria.")).toBeInTheDocument();
    expect(screen.getByText("Informe ao menos uma tag.")).toBeInTheDocument();
    expect(createWorkMock).not.toHaveBeenCalled();
  });

  it("não submete e exibe erro quando o título excede 120 caracteres", async () => {
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await user.type(screen.getByLabelText("Slug"), "restauracao-fusca");
    await user.type(screen.getByLabelText("Título"), "a".repeat(121));
    await user.type(
      screen.getByLabelText("Descrição"),
      "Descrição completa do serviço.",
    );
    await user.type(screen.getByLabelText("Categoria"), "Estofamento");
    await user.type(
      screen.getByLabelText("Tags (separadas por vírgula)"),
      "fusca, restauracao",
    );
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(
      await screen.findByText("O título deve ter no máximo 120 caracteres."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(createWorkMock).not.toHaveBeenCalled();
  });

  it("não submete e exibe erro quando a descrição excede 5000 caracteres", async () => {
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await user.type(screen.getByLabelText("Slug"), "restauracao-fusca");
    await user.type(screen.getByLabelText("Título"), "Restauração Fusca");
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "a".repeat(5001) },
    });
    await user.type(screen.getByLabelText("Categoria"), "Estofamento");
    await user.type(
      screen.getByLabelText("Tags (separadas por vírgula)"),
      "fusca, restauracao",
    );
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(
      await screen.findByText(
        "A descrição deve ter no máximo 5000 caracteres.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(createWorkMock).not.toHaveBeenCalled();
  });

  it("cria o trabalho com o payload preenchido, invalida o cache e navega para /admin", async () => {
    createWorkMock.mockResolvedValue({ id: "1" });
    revalidateWorksTagMock.mockResolvedValue(undefined);
    await submitValidForm();

    await waitFor(() =>
      expect(createWorkMock).toHaveBeenCalledWith({
        slug: "restauracao-fusca",
        title: "Restauração Fusca",
        description: "Descrição completa do serviço.",
        category: "Estofamento",
        tags: ["fusca", "restauracao"],
        status: "draft",
      }),
    );

    // Ordem: mutação Axios -> invalidação de cache -> navegação.
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["admin", "works"],
      refetchType: "none",
    });
    expect(routerPushMock).toHaveBeenCalledWith("/admin");
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Trabalho criado com sucesso.",
    );
    expect(
      createWorkMock.mock.invocationCallOrder[0],
    ).toBeLessThan(revalidateWorksTagMock.mock.invocationCallOrder[0]);
    expect(
      revalidateWorksTagMock.mock.invocationCallOrder[0],
    ).toBeLessThan(routerPushMock.mock.invocationCallOrder[0]);
  });

  it("navega após a criação mesmo quando a invalidação do cache público falha", async () => {
    createWorkMock.mockResolvedValue({ id: "1" });
    revalidateWorksTagMock.mockRejectedValue(new Error("cache unavailable"));

    await submitValidForm();

    await waitFor(() =>
      expect(routerPushMock).toHaveBeenCalledWith("/admin"),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Trabalho criado com sucesso.",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    {
      status: 400,
      statusText: "Bad Request",
      errorMessage: "Título já cadastrado.",
      expectedMessage: "Título já cadastrado.",
    },
    {
      status: 401,
      statusText: "Unauthorized",
      errorMessage: "Sessão expirada. Faça login novamente.",
      expectedMessage: "Sessão expirada. Faça login novamente.",
    },
    {
      status: 409,
      statusText: "Conflict",
      errorMessage: "Já existe um trabalho com este título.",
      expectedMessage: "Já existe um trabalho com este título.",
    },
  ])(
    "exibe mensagem amigável e não navega quando a API retorna $status",
    async ({ status, statusText, errorMessage, expectedMessage }) => {
      createWorkMock.mockRejectedValue(
        createAxiosError(status, statusText, { message: errorMessage }),
      );

      await submitValidForm();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        expectedMessage,
      );
      expect(revalidateWorksTagMock).not.toHaveBeenCalled();
      expect(routerPushMock).not.toHaveBeenCalled();
    },
  );

  it("não expõe detalhes internos da API quando a resposta de erro não tem mensagem", async () => {
    createWorkMock.mockRejectedValue(
      createAxiosError(500, "Internal Server Error", {
        stack: "internal stack trace",
      }),
    );

    await submitValidForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
