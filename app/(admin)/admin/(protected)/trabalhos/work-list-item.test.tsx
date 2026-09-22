import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      url: "https://cdn.example.com/img-1.jpg",
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

function createAxiosError(message: string) {
  const config: InternalAxiosRequestConfig = {
    headers: new AxiosHeaders(),
  };

  return new AxiosError(
    "Internal Server Error",
    "ERR_BAD_RESPONSE",
    config,
    undefined,
    {
      status: 500,
      statusText: "Internal Server Error",
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

describe("WorkListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateQueriesMock.mockResolvedValue(undefined);
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });
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

  it("remove uma imagem, invalida o cache e atualiza a listagem", async () => {
    deleteWorkImageMock.mockResolvedValue(undefined);
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Remover imagem" }));

    await waitFor(() =>
      expect(deleteWorkImageMock).toHaveBeenCalledWith("work-1", "img-1"),
    );
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
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
});
