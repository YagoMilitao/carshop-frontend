import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createWorkMock = vi.fn();
const revalidateWorksTagMock = vi.fn();
const routerRefreshMock = vi.fn();

vi.mock("@/lib/api/works.client", () => ({
  createWork: (payload: unknown) => createWorkMock(payload),
}));

vi.mock("../actions", () => ({
  revalidateWorksTag: () => revalidateWorksTagMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefreshMock }),
}));

import { CreateWorkForm } from "./create-work-form";

describe("CreateWorkForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria o work com o payload preenchido, invalida o cache e reseta o formulário", async () => {
    createWorkMock.mockResolvedValue({ id: "1" });
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<CreateWorkForm />);

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
    await user.click(screen.getByRole("button", { name: "Criar work" }));

    await waitFor(() =>
      expect(createWorkMock).toHaveBeenCalledWith({
        title: "Restauração Fusca",
        description: "Descrição completa do serviço.",
        category: "Estofamento",
        tags: ["fusca", "restauracao"],
        status: "draft",
      }),
    );

    // Ordem: mutação Axios -> invalidação de cache -> refresh do router.
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    expect(
      createWorkMock.mock.invocationCallOrder[0],
    ).toBeLessThan(revalidateWorksTagMock.mock.invocationCallOrder[0]);
    expect(
      revalidateWorksTagMock.mock.invocationCallOrder[0],
    ).toBeLessThan(routerRefreshMock.mock.invocationCallOrder[0]);

    await waitFor(() =>
      expect(screen.getByLabelText("Título")).toHaveValue(""),
    );
  });

  it("exibe a mensagem de erro da API e não invalida o cache quando a mutação falha", async () => {
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

    await user.type(screen.getByLabelText("Título"), "Repetido");
    await user.type(screen.getByLabelText("Descrição"), "Descrição.");
    await user.type(screen.getByLabelText("Categoria"), "Categoria");
    await user.click(screen.getByRole("button", { name: "Criar work" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Título já cadastrado.",
    );
    expect(revalidateWorksTagMock).not.toHaveBeenCalled();
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });
});
