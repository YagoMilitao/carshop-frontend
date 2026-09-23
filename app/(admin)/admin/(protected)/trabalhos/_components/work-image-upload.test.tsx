import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import { WorkImageUpload } from "./work-image-upload";

type OnConfirm = ComponentProps<typeof WorkImageUpload>["onConfirm"];
type User = ReturnType<typeof userEvent.setup>;

const VALID_IMAGE_NAME = "foto.png";
const VALID_IMAGE_PREVIEW_ALT = `Pré-visualização de ${VALID_IMAGE_NAME}`;

function createValidImage() {
  return new File(["conteudo"], VALID_IMAGE_NAME, { type: "image/png" });
}

function renderUpload(onConfirm: OnConfirm, disabled = false) {
  return render(
    <WorkImageUpload disabled={disabled} onConfirm={onConfirm} />,
  );
}

async function renderWithSelectedImage(onConfirm: OnConfirm) {
  const user = userEvent.setup();
  const renderResult = renderUpload(onConfirm);
  const file = createValidImage();

  await user.upload(screen.getByLabelText("Adicionar imagem"), file);

  return { ...renderResult, file, user };
}

async function submitImage(user: User) {
  await user.click(
    await screen.findByRole("button", { name: "Enviar imagem" }),
  );
}

function selectFileIgnoringAccept(file: File) {
  const input = screen.getByLabelText("Adicionar imagem");
  Object.defineProperty(input, "files", { value: [file] });
  fireEvent.change(input);
}

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
    const { file } = await renderWithSelectedImage(onConfirm);

    expect(
      await screen.findByAltText(VALID_IMAGE_PREVIEW_ALT),
    ).toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalledWith(file);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("exibe erro inline para tipo de arquivo inválido sem chamar onConfirm", () => {
    const onConfirm = vi.fn();

    renderUpload(onConfirm);

    const file = new File(["conteudo"], "arquivo.pdf", {
      type: "application/pdf",
    });
    selectFileIgnoringAccept(file);

    expect(
      screen.getByText("Formato de imagem inválido (aceita JPEG, PNG ou WebP)."),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByAltText(/Pré-visualização/)).not.toBeInTheDocument();
  });

  it("exibe erro inline para arquivo acima do limite de 5MB sem chamar onConfirm", () => {
    const onConfirm = vi.fn();

    renderUpload(onConfirm);

    const oversizedContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([oversizedContent], "grande.png", {
      type: "image/png",
    });
    selectFileIgnoringAccept(file);

    expect(screen.getByText(/excede o limite de/)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("chama onConfirm com o arquivo correto ao clicar em 'Enviar imagem'", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { file, user } = await renderWithSelectedImage(onConfirm);

    await submitImage(user);

    expect(onConfirm).toHaveBeenCalledWith(file);
  });

  it("limpa preview e input após sucesso de onConfirm", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { user } = await renderWithSelectedImage(onConfirm);
    await submitImage(user);

    await waitFor(() =>
      expect(
        screen.queryByAltText(VALID_IMAGE_PREVIEW_ALT),
      ).not.toBeInTheDocument(),
    );
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("mantém o preview quando onConfirm falha, permitindo tentar novamente", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("falhou"));
    const { user } = await renderWithSelectedImage(onConfirm);
    await submitImage(user);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(screen.getByAltText(VALID_IMAGE_PREVIEW_ALT)).toBeInTheDocument();
  });

  it("limpa o estado local ao clicar em 'Cancelar', sem chamar onConfirm", async () => {
    const onConfirm = vi.fn();
    const { user } = await renderWithSelectedImage(onConfirm);
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(
      screen.queryByAltText(VALID_IMAGE_PREVIEW_ALT),
    ).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("desabilita input e botões quando disabled=true", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { rerender } = await renderWithSelectedImage(onConfirm);

    rerender(<WorkImageUpload disabled onConfirm={onConfirm} />);

    expect(screen.getByLabelText("Adicionar imagem")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Enviando..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
