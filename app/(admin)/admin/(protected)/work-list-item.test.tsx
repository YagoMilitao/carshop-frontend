import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Work } from "@/lib/api/works";

const deleteWorkMock = vi.fn();
const deleteWorkImageMock = vi.fn();
const uploadWorkImageMock = vi.fn();
const revalidateWorksTagMock = vi.fn();
const routerRefreshMock = vi.fn();

vi.mock("@/lib/api/works.client", () => ({
  deleteWork: (workId: string) => deleteWorkMock(workId),
}));

vi.mock("@/lib/api/images.client", () => ({
  ACCEPTED_IMAGE_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  deleteWorkImage: (workId: string, imageId: string) =>
    deleteWorkImageMock(workId, imageId),
  uploadWorkImage: (workId: string, file: File) =>
    uploadWorkImageMock(workId, file),
}));

vi.mock("../actions", () => ({
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

describe("WorkListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exclui o work, invalida o cache e atualiza a listagem", async () => {
    deleteWorkMock.mockResolvedValue(undefined);
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Excluir work" }));

    await waitFor(() => expect(deleteWorkMock).toHaveBeenCalledWith("work-1"));
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });

  it("exibe erro da API quando a exclusão do work falha, sem invalidar o cache", async () => {
    deleteWorkMock.mockRejectedValue(
      new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: {} as never,
        data: { message: "Falha ao excluir work." },
      }),
    );
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    await user.click(screen.getByRole("button", { name: "Excluir work" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao excluir work.",
    );
    expect(revalidateWorksTagMock).not.toHaveBeenCalled();
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

  it("faz upload de uma imagem válida (tipo/tamanho aceitos)", async () => {
    uploadWorkImageMock.mockResolvedValue({});
    revalidateWorksTagMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkListItem work={work} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    const input = screen.getByLabelText("Adicionar imagem");

    await user.upload(input, file);

    await waitFor(() =>
      expect(uploadWorkImageMock).toHaveBeenCalledWith("work-1", file),
    );
    expect(revalidateWorksTagMock).toHaveBeenCalledTimes(1);
  });

  it("rejeita upload de tipo de arquivo inválido sem chamar a API", async () => {
    render(<WorkListItem work={work} />);

    // `userEvent.upload` filtra pelo atributo `accept` do input antes de
    // disparar o evento (não exercitaria a validação client-side do
    // componente) — usamos `fireEvent.change` para simular a seleção real
    // de um arquivo fora do `accept` (ex.: usuário força via drag-and-drop
    // ou navegador não filtra), garantindo cobertura do branch de
    // validação de tipo em `onUploadImage`.
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
