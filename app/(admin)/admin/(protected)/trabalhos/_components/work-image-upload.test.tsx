import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkImageUpload } from "./work-image-upload";

// jsdom não implementa `URL.createObjectURL`/`URL.revokeObjectURL` — o
// componente depende deles para gerar/limpar o preview local, então
// stubamos com um contador simples para simular URLs de blob distintas.
let objectUrlCounter = 0;
const createObjectURLMock = vi.fn(() => `blob:mock-${++objectUrlCounter}`);
const revokeObjectURLMock = vi.fn();

describe("WorkImageUpload", () => {
  beforeEach(() => {
    objectUrlCounter = 0;
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

  it("exibe preview local ao selecionar um arquivo válido", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkImageUpload disabled={false} onConfirm={onConfirm} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    const input = screen.getByLabelText("Adicionar imagem");

    await user.upload(input, file);

    expect(
      await screen.findByAltText("Pré-visualização de foto.png"),
    ).toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalledWith(file);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("exibe erro inline para tipo de arquivo inválido sem chamar onConfirm", () => {
    const onConfirm = vi.fn();

    render(<WorkImageUpload disabled={false} onConfirm={onConfirm} />);

    const file = new File(["conteudo"], "arquivo.pdf", {
      type: "application/pdf",
    });
    const input = screen.getByLabelText("Adicionar imagem");
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    expect(
      screen.getByText("Formato de imagem inválido (aceita JPEG, PNG ou WebP)."),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByAltText(/Pré-visualização/)).not.toBeInTheDocument();
  });

  it("exibe erro inline para arquivo acima do limite de 5MB sem chamar onConfirm", () => {
    const onConfirm = vi.fn();

    render(<WorkImageUpload disabled={false} onConfirm={onConfirm} />);

    const oversizedContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([oversizedContent], "grande.png", {
      type: "image/png",
    });
    const input = screen.getByLabelText("Adicionar imagem");
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    expect(screen.getByText(/excede o limite de/)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("chama onConfirm com o arquivo correto ao clicar em 'Enviar imagem'", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkImageUpload disabled={false} onConfirm={onConfirm} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);

    await user.click(
      await screen.findByRole("button", { name: "Enviar imagem" }),
    );

    expect(onConfirm).toHaveBeenCalledWith(file);
  });

  it("limpa preview e input após sucesso de onConfirm", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<WorkImageUpload disabled={false} onConfirm={onConfirm} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);
    await user.click(
      await screen.findByRole("button", { name: "Enviar imagem" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByAltText("Pré-visualização de foto.png"),
      ).not.toBeInTheDocument(),
    );
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("mantém o preview quando onConfirm falha, permitindo tentar novamente", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();

    render(<WorkImageUpload disabled={false} onConfirm={onConfirm} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);
    await user.click(
      await screen.findByRole("button", { name: "Enviar imagem" }),
    );

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(
      screen.getByAltText("Pré-visualização de foto.png"),
    ).toBeInTheDocument();
  });

  it("limpa o estado local ao clicar em 'Cancelar', sem chamar onConfirm", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(<WorkImageUpload disabled={false} onConfirm={onConfirm} />);

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(
      screen.queryByAltText("Pré-visualização de foto.png"),
    ).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("desabilita input e botões quando disabled=true", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <WorkImageUpload disabled={false} onConfirm={onConfirm} />,
    );

    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText("Adicionar imagem"), file);

    rerender(<WorkImageUpload disabled onConfirm={onConfirm} />);

    expect(screen.getByLabelText("Adicionar imagem")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Enviando..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
