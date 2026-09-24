import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, type ComponentProps } from "react";

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

  it("cria uma única blob URL para cada seleção no Strict Mode", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const file = createValidImage();

    render(
      <StrictMode>
        <WorkImageUpload disabled={false} onConfirm={onConfirm} />
      </StrictMode>,
    );

    await user.upload(screen.getByLabelText("Adicionar imagem"), file);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(createObjectURLMock).toHaveBeenCalledWith(file);
  });

  it("revoga a blob URL anterior na troca e a atual ao desmontar", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { unmount } = renderUpload(onConfirm);
    const input = screen.getByLabelText("Adicionar imagem");

    await user.upload(input, createValidImage());
    await user.upload(
      input,
      new File(["outro conteúdo"], "outra-foto.webp", {
        type: "image/webp",
      }),
    );

    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenLastCalledWith("blob:mock-1");

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledTimes(2);
    expect(revokeObjectURLMock).toHaveBeenLastCalledWith("blob:mock-2");
  });

  it("exibe erro inline para tipo de arquivo inválido sem chamar onConfirm", () => {
    const onConfirm = vi.fn();

    renderUpload(onConfirm);

    const file = new File(["conteudo"], "arquivo.pdf", {
      type: "application/pdf",
    });
    selectFileIgnoringAccept(file);

    const error = screen.getByRole("alert");
    const addButton = screen.getByRole("button", { name: "Adicionar imagem" });

    expect(error).toHaveTextContent(
      "Formato de imagem inválido (aceita JPEG, PNG ou WebP).",
    );
    expect(addButton).toHaveAccessibleDescription(
      "Formato de imagem inválido (aceita JPEG, PNG ou WebP).",
    );
    expect(addButton).toHaveAttribute("aria-describedby", error.id);
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
    expect(
      screen.getByRole("button", { name: "Adicionar imagem" }),
    ).toHaveFocus();
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
    expect(
      screen.getByRole("button", { name: "Adicionar imagem" }),
    ).toHaveFocus();
  });

  it("mantém o rótulo neutro quando outra mutação desabilita os controles", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { rerender } = await renderWithSelectedImage(onConfirm);

    rerender(<WorkImageUpload disabled onConfirm={onConfirm} />);

    expect(screen.getByLabelText("Adicionar imagem")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Adicionar imagem" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Enviar imagem" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("exibe 'Enviando...' somente enquanto o upload está pendente", async () => {
    let resolveConfirm = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    const { user } = await renderWithSelectedImage(onConfirm);

    await submitImage(user);

    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    resolveConfirm();

    await waitFor(() =>
      expect(
        screen.queryByAltText(VALID_IMAGE_PREVIEW_ALT),
      ).not.toBeInTheDocument(),
    );
  });
  describe("seletor de arquivo", () => {
    it("associa o estado inicial do arquivo ao botão customizado", () => {
      renderUpload(vi.fn());

      const addButton = screen.getByRole("button", {
        name: "Adicionar imagem",
      });
      const fileStatus = screen.getByRole("status");

      expect(fileStatus).toHaveTextContent("Nenhum arquivo escolhido");
      expect(addButton).toHaveAccessibleDescription(
        "Nenhum arquivo escolhido",
      );
      // O input nativo fica fora da ordem de tabulação e da árvore de
      // acessibilidade para não duplicar o controle.
      const input = screen.getByLabelText("Adicionar imagem");
      expect(input).toHaveAttribute("tabindex", "-1");
      expect(input).toHaveAttribute("aria-hidden", "true");
    });

    it("abre o seletor nativo ao clicar em 'Adicionar imagem'", async () => {
      const user = userEvent.setup();
      renderUpload(vi.fn());
      const input = screen.getByLabelText("Adicionar imagem");
      const clickSpy = vi.spyOn(input, "click");

      await user.click(
        screen.getByRole("button", { name: "Adicionar imagem" }),
      );

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it("anuncia e associa o nome selecionado, voltando ao estado padrão ao cancelar", async () => {
      const { user } = await renderWithSelectedImage(vi.fn());

      const addButton = screen.getByRole("button", {
        name: "Adicionar imagem",
      });
      const fileStatus = screen.getByRole("status");

      expect(fileStatus).toHaveTextContent(VALID_IMAGE_NAME);
      expect(addButton).toHaveAccessibleDescription(VALID_IMAGE_NAME);
      expect(
        screen.queryByText("Nenhum arquivo escolhido"),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(fileStatus).toHaveTextContent("Nenhum arquivo escolhido");
      expect(addButton).toHaveAccessibleDescription(
        "Nenhum arquivo escolhido",
      );
    });
  });
});
