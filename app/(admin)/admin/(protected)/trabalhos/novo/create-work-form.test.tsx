import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createWorkMock = vi.fn();
const revalidateWorksTagMock = vi.fn();
const routerPushMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("@/lib/api/works.client", () => ({
  createWork: (payload: unknown) => createWorkMock(payload),
}));

vi.mock("../../../actions", () => ({
  revalidateWorksTag: () => revalidateWorksTagMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

import { CreateWorkForm } from "./create-work-form";

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Título"), "Restauração Fusca");
  await user.type(
    screen.getByLabelText("Descrição"),
    "Descrição completa do serviço.",
  );
  await user.type(screen.getByLabelText("Categoria"), "Estofamento");
  await user.type(
    screen.getByLabelText("Tags (separadas por vírgula)"),
    "fusca, restauracao",
  );
}

describe("CreateWorkForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não submete e exibe erros de validação quando campos obrigatórios estão vazios", async () => {
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(await screen.findByText("Informe o título.")).toBeInTheDocument();
    expect(screen.getByText("Informe a descrição.")).toBeInTheDocument();
    expect(screen.getByText("Informe a categoria.")).toBeInTheDocument();
    expect(screen.getByText("Informe ao menos uma tag.")).toBeInTheDocument();

    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(createWorkMock).not.toHaveBeenCalled();
  });

  it("não submete e exibe erro quando o título excede 120 caracteres", async () => {
    const user = userEvent.setup();

    render(<CreateWorkForm />);

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
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    await waitFor(() =>
      expect(createWorkMock).toHaveBeenCalledWith({
        title: "Restauração Fusca",
        description: "Descrição completa do serviço.",
        category: "Estofamento",
        tags: ["fusca", "restauracao"],
        status: "draft",
      }),
    );

    // Ordem: mutação Axios -> invalidação de cache -> navegação.
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
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

  it("exibe mensagem amigável e não navega quando a API retorna 400", async () => {
    createWorkMock.mockRejectedValue(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as never,
        data: { message: "Título já cadastrado." },
      }),
    );
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Título já cadastrado.",
    );
    expect(revalidateWorksTagMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("exibe mensagem amigável e não navega quando a API retorna 401", async () => {
    createWorkMock.mockRejectedValue(
      new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config: {} as never,
        data: { message: "Sessão expirada. Faça login novamente." },
      }),
    );
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sessão expirada. Faça login novamente.",
    );
    expect(revalidateWorksTagMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("exibe mensagem amigável e não navega quando a API retorna 409", async () => {
    createWorkMock.mockRejectedValue(
      new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: {} as never,
        data: { message: "Já existe um trabalho com este título." },
      }),
    );
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um trabalho com este título.",
    );
    expect(revalidateWorksTagMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("não expõe detalhes internos da API quando a resposta de erro não tem mensagem", async () => {
    createWorkMock.mockRejectedValue(
      new AxiosError("Internal Server Error", "ERR_BAD_RESPONSE", undefined, undefined, {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: {} as never,
        data: { stack: "internal stack trace" },
      }),
    );
    const user = userEvent.setup();

    render(<CreateWorkForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Criar trabalho" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
