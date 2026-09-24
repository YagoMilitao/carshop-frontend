import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Work } from "@/lib/api/works";

const deleteWorkMock = vi.fn();
const deleteWorkImageMock = vi.fn();
const uploadWorkImageMock = vi.fn();
const revalidateWorksTagMock = vi.fn();
const invalidateQueriesMock = vi.fn();
const routerRefreshMock = vi.fn();

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  deleteWork: (workId: string) => deleteWorkMock(workId),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock("@/lib/api/images.client", () => ({
  ACCEPTED_IMAGE_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  deleteWorkImage: (workId: string, imageId: string) =>
    deleteWorkImageMock(workId, imageId),
  uploadWorkImage: (workId: string, file: File) =>
    uploadWorkImageMock(workId, file),
}));

vi.mock("../../actions", () => ({
  revalidateWorksTag: () => revalidateWorksTagMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefreshMock }),
}));

import { WorkListItem } from "./work-list-item";

const work: Work = {
  id: "work-1",
  slug: "restauracao-fusca",
  title: "Restauração Fusca",
  description: "Descrição",
  category: "Estofamento",
  tags: ["fusca"],
  images: [
    {
      id: "img-1",
      url: "https://res.cloudinary.com/demo/img-1.jpg",
      publicId: "img-1",
      alt: "Banco restaurado",
      isCover: true,
      order: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

function createAxiosError(message: string, status = 500) {
  const config: InternalAxiosRequestConfig = {
    headers: new AxiosHeaders(),
  };

  return new AxiosError(
    message,
    status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
    config,
    undefined,
    {
      status,
      statusText: String(status),
      headers: new AxiosHeaders(),
      config,
      data: { message },
    },
  );
}

// jsdom não implementa `URL.createObjectURL`/`URL.revokeObjectURL`, usados
// pelo preview de `WorkImageUpload` — stubamos para os testes que
// exercitam o fluxo de upload.
const createObjectURLMock = vi.fn(() => "blob:mock-1");
const revokeObjectURLMock = vi.fn();
const OriginalURL = URL;

describe("WorkListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateQueriesMock.mockResolvedValue(undefined);
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    // Subclasse (em vez de um objeto espalhado) para preservar o construtor
    // `new URL(...)`, usado pelo `next/image` das miniaturas do grid.
    vi.stubGlobal(
      "URL",
      class extends OriginalURL {
        static createObjectURL = createObjectURLMock;
        static revokeObjectURL = revokeObjectURLMock;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exibe o título e o status do work em um Badge", () => {
    render(<WorkListItem work={work} />);

    expect(screen.getByText("Restauração Fusca")).toBeInTheDocument();

    const statusBadge = screen.getByText("published");
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveAttribute("data-slot", "badge");
  });

  it("destaca o status 'published' em verde e mantém 'draft' neutro", () => {
    const { rerender } = render(<WorkListItem work={work} />);

    expect(screen.getByText("published")).toHaveAttribute(
      "data-variant",
      "success",
    );

    rerender(<WorkListItem work={{ ...work, status: "draft" }} />);

    expect(screen.getByText("draft")).toHaveAttribute(
      "data-variant",
      "secondary",
    );
  });

  it("exibe um link 'Editar' habilitado apontando para a rota de edição (CARSHOP-32)", () => {
    render(<WorkListItem work={work} />);

    const editLink = screen.getByRole("link", { name: "Editar" });
    expect(editLink).toHaveAttribute(
      "href",
      "/admin/trabalhos/restauracao-fusca/editar",
    );
    expect(editLink).not.toHaveAttribute("aria-disabled");
    expect(editLink).not.toHaveAttribute("title");
  });

  it("não chama deleteWork apenas ao clicar em 'Excluir work' (exige confirmação)", async () => {
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Excluir work" }));

    expect(
      await screen.findByRole("heading", { name: "Excluir work" }),
    ).toBeInTheDocument();
    expect(deleteWorkMock).not.toHaveBeenCalled();
  });

  it("exclui o work ao confirmar no diálogo, invalida o cache e atualiza a listagem", async () => {
    deleteWorkMock.mockResolvedValue(undefined);
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Excluir work" }));
    await user.click(await screen.findByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(deleteWorkMock).toHaveBeenCalledWith("work-1"));
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["admin", "works"],
    });
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });

  it("cancela a exclusão sem chamar deleteWork", async () => {
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Excluir work" }));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Excluir work" }),
      ).not.toBeInTheDocument(),
    );
    expect(deleteWorkMock).not.toHaveBeenCalled();
  });

  it("devolve o foco ao botão 'Excluir work' ao cancelar ou fechar com Esc o diálogo de exclusão", async () => {
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    const deleteWorkButton = screen.getByRole("button", {
      name: "Excluir work",
    });

    await user.click(deleteWorkButton);
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Excluir work" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(deleteWorkButton).toHaveFocus());

    await user.click(deleteWorkButton);
    expect(
      await screen.findByRole("heading", { name: "Excluir work" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Excluir work" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(deleteWorkButton).toHaveFocus());
    expect(deleteWorkMock).not.toHaveBeenCalled();
  });

  it("exibe erro da API no diálogo quando a exclusão do work falha, sem invalidar o cache", async () => {
    deleteWorkMock.mockRejectedValue(
      createAxiosError("Falha ao excluir work."),
    );
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Excluir work" }));
    await user.click(await screen.findByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao excluir work.",
    );
    expect(revalidateWorksTagMock).not.toHaveBeenCalled();
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });

  it("não apresenta a exclusão como falha quando a sincronização de cache falha", async () => {
    deleteWorkMock.mockResolvedValue(undefined);
    revalidateWorksTagMock.mockRejectedValue(new Error("cache unavailable"));
    invalidateQueriesMock.mockRejectedValue(new Error("query unavailable"));
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Excluir work" }));
    await user.click(await screen.findByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(routerRefreshMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("remove uma imagem somente após confirmação, invalida o cache e atualiza a listagem", async () => {
    deleteWorkImageMock.mockResolvedValue(undefined);
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(
      screen.getByRole("button", { name: "Remover imagem: Banco restaurado" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Remover imagem" }),
    ).toBeInTheDocument();
    expect(deleteWorkImageMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir imagem" }));

    await waitFor(() =>
      expect(deleteWorkImageMock).toHaveBeenCalledWith("work-1", "img-1"),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Remover imagem" }),
      ).not.toBeInTheDocument(),
    );
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["admin", "works"],
    });
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });

  it("devolve o foco ao botão 'Remover' ao cancelar ou fechar com Esc o diálogo de remoção", async () => {
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    const removeButton = screen.getByRole("button", {
      name: "Remover imagem: Banco restaurado",
    });

    await user.click(removeButton);
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Remover imagem" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(removeButton).toHaveFocus());

    await user.click(removeButton);
    expect(
      await screen.findByRole("heading", { name: "Remover imagem" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Remover imagem" }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(removeButton).toHaveFocus());
    expect(deleteWorkImageMock).not.toHaveBeenCalled();
  });

  it("desabilita o upload sem sinalizar 'Enviando...' enquanto uma imagem existente está sendo removida", async () => {
    let resolveDeleteImage = () => {};
    deleteWorkImageMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDeleteImage = resolve;
        }),
    );
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);
    await user.click(
      screen.getByRole("button", { name: "Remover imagem: Banco restaurado" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Excluir imagem" }),
    );

    await waitFor(() => expect(deleteWorkImageMock).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("button", { name: "Excluindo..." }),
    ).toBeDisabled();
    // Com o diálogo modal aberto, o restante da página fica fora da árvore
    // de acessibilidade — consultamos com `hidden: true`.
    expect(
      screen.getByRole("button", { name: "Enviar imagem", hidden: true }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Enviando...", hidden: true }),
    ).not.toBeInTheDocument();

    resolveDeleteImage();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Enviar imagem" }),
      ).toBeEnabled(),
    );
  });

  it("não faz nada quando o input de arquivo dispara change sem arquivo selecionado", () => {
    render(<WorkListItem work={work} />);

    const input = screen.getByLabelText("Adicionar imagem");
    Object.defineProperty(input, "files", { value: [] });
    fireEvent.change(input);

    expect(uploadWorkImageMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("faz upload de uma imagem válida somente após confirmação explícita (preview + 'Enviar imagem')", async () => {
    uploadWorkImageMock.mockResolvedValue({});
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    const input = screen.getByLabelText("Adicionar imagem");

    await user.upload(input, file);

    // Seleção por si só não deve disparar upload — exige preview visível
    // e confirmação explícita do usuário.
    expect(
      await screen.findByAltText("Pré-visualização de foto.png"),
    ).toBeInTheDocument();
    expect(uploadWorkImageMock).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Enviar imagem" }),
    );

    await waitFor(() =>
      expect(uploadWorkImageMock).toHaveBeenCalledWith("work-1", file),
    );
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByAltText("Pré-visualização de foto.png"),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Adicionar imagem" }),
    ).toHaveFocus();
  });

  it("cancela a seleção de imagem sem chamar a API", async () => {
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);

    expect(
      await screen.findByAltText("Pré-visualização de foto.png"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.queryByAltText("Pré-visualização de foto.png"),
    ).not.toBeInTheDocument();
    expect(uploadWorkImageMock).not.toHaveBeenCalled();
  });

  it("exibe erro da API quando o upload falha, mantendo o preview para nova tentativa", async () => {
    uploadWorkImageMock.mockRejectedValue(
      createAxiosError("Falha ao enviar imagem."),
    );
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);
    await user.click(
      await screen.findByRole("button", { name: "Enviar imagem" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao enviar imagem.",
    );
    expect(revalidateWorksTagMock).not.toHaveBeenCalled();
    expect(
      screen.getByAltText("Pré-visualização de foto.png"),
    ).toBeInTheDocument();
  });

  it("rejeita upload de tipo de arquivo inválido sem chamar a API", async () => {
    render(<WorkListItem work={work} />);

    // `userEvent.upload` filtra pelo atributo `accept` do input antes de
    // disparar o evento (não exercitaria a validação client-side do
    // componente) — usamos `fireEvent.change` para simular a seleção real
    // de um arquivo fora do `accept` (ex.: usuário força via drag-and-drop
    // ou navegador não filtra), garantindo cobertura do branch de
    // validação de tipo em `WorkImageUpload`.
    const file = new File(["conteudo"], "arquivo.pdf", {
      type: "application/pdf",
    });
    const input = screen.getByLabelText("Adicionar imagem");
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    expect(
      await screen.findByText(
        "Formato de imagem inválido (aceita JPEG, PNG ou WebP).",
      ),
    ).toBeInTheDocument();
    expect(uploadWorkImageMock).not.toHaveBeenCalled();
  });

  it("rejeita upload de arquivo acima do limite de 5MB sem chamar a API", async () => {
    render(<WorkListItem work={work} />);

    const oversizedContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([oversizedContent], "grande.png", {
      type: "image/png",
    });
    const input = screen.getByLabelText("Adicionar imagem");
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    expect(
      await screen.findByText(/excede o limite de/),
    ).toBeInTheDocument();
    expect(uploadWorkImageMock).not.toHaveBeenCalled();
  });
  describe("remoção de imagem existente (CARSHOP-34)", () => {
    const REMOVE_BUTTON_NAME = "Remover imagem: Banco restaurado";

    async function openRemoveDialog(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole("button", { name: REMOVE_BUTTON_NAME }));

      return screen.findByRole("alertdialog");
    }

    async function submitRemoveWithNotFound(
      user: ReturnType<typeof userEvent.setup>,
    ) {
      deleteWorkImageMock.mockRejectedValue(
        createAxiosError("Not found", 404),
      );
      revalidateWorksTagMock.mockResolvedValue(undefined);

      render(<WorkListItem work={work} />);

      const dialog = await openRemoveDialog(user);
      await user.click(
        within(dialog).getByRole("button", { name: "Excluir imagem" }),
      );
      await within(dialog).findByRole("alert");

      return dialog;
    }

    async function closeRemoveDialog(
      user: ReturnType<typeof userEvent.setup>,
      dialog: HTMLElement,
    ) {
      await user.click(within(dialog).getByRole("button", { name: "Fechar" }));
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
    }

    it("exibe estado vazio e contador zerado quando o work não tem imagens", () => {
      render(<WorkListItem work={{ ...work, images: [] }} />);

      expect(
        screen.getByRole("heading", { name: "Imagens (0) do trabalho Restauração Fusca" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nenhuma imagem cadastrada para este trabalho."),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Remover imagem/ }),
      ).not.toBeInTheDocument();
    });

    it("exibe a miniatura da imagem no grid com o alt real", () => {
      render(<WorkListItem work={work} />);

      expect(
        screen.getByRole("heading", { name: "Imagens (1) do trabalho Restauração Fusca" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Banco restaurado" })).toBeInTheDocument();
      expect(screen.getByText("Capa")).toBeInTheDocument();
    });

    it("cancelar o diálogo não chama a API nem sincroniza", async () => {
      const user = userEvent.setup();

      render(<WorkListItem work={work} />);

      const dialog = await openRemoveDialog(user);
      expect(dialog).toHaveTextContent("Banco restaurado");

      await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(deleteWorkImageMock).not.toHaveBeenCalled();
      expect(invalidateQueriesMock).not.toHaveBeenCalled();
      expect(revalidateWorksTagMock).not.toHaveBeenCalled();
      expect(routerRefreshMock).not.toHaveBeenCalled();
    });

    it("em 404 sincroniza a lista e mantém o diálogo aberto com a mensagem", async () => {
      const user = userEvent.setup();
      const dialog = await submitRemoveWithNotFound(user);

      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        "Imagem ou trabalho não encontrado. A lista foi atualizada.",
      );
      expect(deleteWorkImageMock).toHaveBeenCalledWith("work-1", "img-1");
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ["admin", "works"],
      });
      expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      // A imagem já não existe: não há como confirmar de novo (evita um
      // segundo DELETE), sobra só "Fechar".
      expect(
        within(dialog).queryByRole("button", { name: "Excluir imagem" }),
      ).not.toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Fechar" }),
      ).toBeEnabled();
      expect(deleteWorkImageMock).toHaveBeenCalledTimes(1);
    });

    it("reabilita a confirmação ao abrir uma nova remoção após um 404", async () => {
      const user = userEvent.setup();
      const dialog = await submitRemoveWithNotFound(user);
      await closeRemoveDialog(user, dialog);

      const reopened = await openRemoveDialog(user);
      expect(
        within(reopened).getByRole("button", { name: "Excluir imagem" }),
      ).toBeEnabled();
      expect(within(reopened).queryByRole("alert")).not.toBeInTheDocument();
    });

    it("após 404, fechar o diálogo leva o foco ao heading da seção", async () => {
      const user = userEvent.setup();
      const dialog = await submitRemoveWithNotFound(user);
      await closeRemoveDialog(user, dialog);
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Imagens (1) do trabalho Restauração Fusca" }),
        ).toHaveFocus(),
      );
    });

    it.each([
      [401, "Sua sessão expirou. Faça login novamente."],
      [429, "Muitas tentativas. Aguarde alguns instantes e tente novamente."],
      [500, "Não foi possível remover a imagem. Tente novamente."],
    ])(
      "em %i exibe a mensagem no diálogo sem sincronizar",
      async (status, expectedMessage) => {
        deleteWorkImageMock.mockRejectedValue(
          createAxiosError("Mensagem do backend", status),
        );
        const user = userEvent.setup();

        render(<WorkListItem work={work} />);

        const dialog = await openRemoveDialog(user);
        await user.click(
          within(dialog).getByRole("button", { name: "Excluir imagem" }),
        );

        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
          expectedMessage,
        );
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
        expect(revalidateWorksTagMock).not.toHaveBeenCalled();
        expect(routerRefreshMock).not.toHaveBeenCalled();
        // Permite nova tentativa.
        expect(
          within(dialog).getByRole("button", { name: "Excluir imagem" }),
        ).toBeEnabled();
      },
    );

    it("erro de remoção não aparece no alerta do upload e some ao fechar o diálogo", async () => {
      deleteWorkImageMock.mockRejectedValue(
        createAxiosError("Mensagem do backend", 500),
      );
      const user = userEvent.setup();

      render(<WorkListItem work={work} />);

      const dialog = await openRemoveDialog(user);
      await user.click(
        within(dialog).getByRole("button", { name: "Excluir imagem" }),
      );
      await within(dialog).findByRole("alert");

      const alerts = screen.getAllByRole("alert", { hidden: true });
      expect(alerts).toHaveLength(1);
      expect(dialog).toContainElement(alerts[0] ?? null);

      await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(uploadWorkImageMock).not.toHaveBeenCalled();
    });

    it("erro de upload não aparece no diálogo de remoção", async () => {
      uploadWorkImageMock.mockRejectedValue(
        createAxiosError("Falha ao enviar imagem."),
      );
      const user = userEvent.setup();

      render(<WorkListItem work={work} />);

      await user.upload(
        screen.getByLabelText("Adicionar imagem"),
        new File(["conteudo"], "foto.png", { type: "image/png" }),
      );
      await user.click(
        await screen.findByRole("button", { name: "Enviar imagem" }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Falha ao enviar imagem.",
      );

      const dialog = await openRemoveDialog(user);

      expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
      expect(dialog).not.toHaveTextContent("Falha ao enviar imagem.");
      expect(deleteWorkImageMock).not.toHaveBeenCalled();
    });

    it("após sucesso anuncia 'Imagem removida.' e leva o foco ao heading da seção", async () => {
      deleteWorkImageMock.mockResolvedValue(undefined);
      revalidateWorksTagMock.mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<WorkListItem work={work} />);

      expect(screen.getByRole("status")).toBeEmptyDOMElement();

      const dialog = await openRemoveDialog(user);
      await user.click(
        within(dialog).getByRole("button", { name: "Excluir imagem" }),
      );

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("status")).toHaveTextContent("Imagem removida.");
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Imagens (1) do trabalho Restauração Fusca" }),
        ).toHaveFocus(),
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("limpa o anúncio de status ao abrir um novo diálogo de remoção", async () => {
      deleteWorkImageMock.mockResolvedValue(undefined);
      revalidateWorksTagMock.mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<WorkListItem work={work} />);

      const dialog = await openRemoveDialog(user);
      await user.click(
        within(dialog).getByRole("button", { name: "Excluir imagem" }),
      );
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Imagem removida.",
        ),
      );

      await openRemoveDialog(user);

      expect(
        screen.getByRole("status", { hidden: true }),
      ).toBeEmptyDOMElement();
    });

    it("não fecha o diálogo (Esc/Cancelar) enquanto o DELETE está pendente", async () => {
      let resolveDeleteImage = () => {};
      deleteWorkImageMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveDeleteImage = resolve;
          }),
      );
      revalidateWorksTagMock.mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<WorkListItem work={work} />);

      const dialog = await openRemoveDialog(user);
      await user.click(
        within(dialog).getByRole("button", { name: "Excluir imagem" }),
      );

      const pendingButton = await within(dialog).findByRole("button", {
        name: "Excluindo...",
      });
      expect(pendingButton).toBeDisabled();
      expect(
        within(dialog).getByRole("button", { name: "Cancelar" }),
      ).toBeDisabled();

      await user.keyboard("{Escape}");

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Excluir work", hidden: true }),
      ).toBeDisabled();

      resolveDeleteImage();

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(deleteWorkImageMock).toHaveBeenCalledTimes(1);
    });
  });
});
