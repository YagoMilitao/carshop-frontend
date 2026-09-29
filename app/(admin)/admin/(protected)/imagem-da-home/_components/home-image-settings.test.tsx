import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeImage } from "@/lib/api/home-image";
import type { SetHomeImagePayload } from "@/lib/api/home-image.client";
import type { Work } from "@/lib/api/works";

const getHomeImageMock = vi.fn<() => Promise<HomeImage | null>>();
const setHomeImageMock =
  vi.fn<(payload: SetHomeImagePayload) => Promise<HomeImage>>();
const getAdminWorksMock = vi.fn<() => Promise<Work[]>>();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/api/home-image.client", () => ({
  homeImageQueryKey: ["home-image"],
  getHomeImage: () => getHomeImageMock(),
  setHomeImage: (payload: SetHomeImagePayload) => setHomeImageMock(payload),
}));

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  getAdminWorks: () => getAdminWorksMock(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
    error: (message: string) => toastErrorMock(message),
  },
}));

import { HomeImageSettings } from "./home-image-settings";
import { makeImage, makeWork } from "./home-image.test-helpers";

function createAxiosError(status: number) {
  const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() };

  return new AxiosError("erro", "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config,
    data: { message: "erro" },
  });
}

const works: Work[] = [
  makeWork("w1", {
    title: "Bancos em couro",
    images: [
      makeImage("a1", 0, { alt: "Banco dianteiro em couro" }),
      makeImage("a2", 1),
    ],
  }),
  makeWork("w2", {
    title: "Painel restaurado",
    images: [makeImage("b1", 0, { alt: "Painel em madeira" })],
  }),
  makeWork("draft", { status: "draft", title: "Rascunho" }),
];

const activeImage: HomeImage = {
  workId: "w1",
  imageId: "a1",
  url: "https://res.cloudinary.com/demo/image/upload/a1.jpg",
  alt: "Banco dianteiro em couro",
};

let queryClient: QueryClient;

function renderSettings() {
  return render(
    <QueryClientProvider client={queryClient}>
      <HomeImageSettings />
    </QueryClientProvider>,
  );
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const SAVE = { name: "Salvar imagem da Home" } as const;

describe("HomeImageSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("mostra loading independente nas duas seções", () => {
    getHomeImageMock.mockReturnValue(new Promise(() => undefined));
    getAdminWorksMock.mockReturnValue(new Promise(() => undefined));

    renderSettings();

    expect(screen.getByText("Carregando imagem atual...")).toBeInTheDocument();
    expect(
      screen.getByText("Carregando imagens disponíveis..."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", SAVE)).not.toBeInTheDocument();
  });

  it("aguarda a imagem atual antes de habilitar seleção e salvamento", async () => {
    const user = userEvent.setup();
    const pendingCurrentImage = deferred<HomeImage | null>();
    getHomeImageMock.mockReturnValue(pendingCurrentImage.promise);
    getAdminWorksMock.mockResolvedValue(works);

    renderSettings();

    const candidate = await screen.findByRole("radio", {
      name: "imagem 1: Painel em madeira",
    });
    expect(candidate).toBeDisabled();
    expect(screen.getByRole("button", SAVE)).toBeDisabled();

    await user.click(candidate);
    expect(candidate).not.toBeChecked();
    expect(setHomeImageMock).not.toHaveBeenCalled();

    pendingCurrentImage.resolve(activeImage);

    await waitFor(() => expect(candidate).toBeEnabled());
    await user.click(candidate);
    expect(screen.getByRole("button", SAVE)).toBeEnabled();
  });

  it("exibe a imagem atual com metadados e marca a ativa com 'Na Home'", async () => {
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockResolvedValue(works);

    renderSettings();

    const current = await screen.findByRole("region", { name: "Imagem atual" });
    expect(
      await within(current).findByText("Bancos em couro"),
    ).toBeInTheDocument();
    expect(
      within(current).getByRole("img", { name: "Banco dianteiro em couro" }),
    ).toBeInTheDocument();

    const activeRadio = await screen.findByRole("radio", {
      name: "imagem 1: Banco dianteiro em couro (imagem atual da Home)",
    });
    expect(activeRadio).toBeChecked();
    expect(screen.getAllByText("Na Home")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Imagens disponíveis (3)" }),
    ).toBeInTheDocument();
    // Um fieldset por work elegível, rascunho excluído.
    expect(screen.getByRole("group", { name: "Bancos em couro" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Painel restaurado" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Rascunho" })).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma alteração")).toBeInTheDocument();
    expect(screen.getByRole("button", SAVE)).toBeDisabled();
  });

  it("diferencia os nomes acessíveis quando imagens repetem o mesmo alt", async () => {
    getHomeImageMock.mockResolvedValue(null);
    getAdminWorksMock.mockResolvedValue([
      makeWork("w1", {
        title: "Bancos em couro",
        images: [
          makeImage("a1", 0, { alt: "Detalhe do banco" }),
          makeImage("a2", 1, { alt: "Detalhe do banco" }),
        ],
      }),
    ]);

    renderSettings();

    expect(
      await screen.findByRole("radio", { name: "imagem 1: Detalhe do banco" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "imagem 2: Detalhe do banco" }),
    ).toBeInTheDocument();
  });

  it("usa o workId como título quando a lista de candidatas falha, e 'Sem texto alternativo'", async () => {
    getHomeImageMock.mockResolvedValue({ ...activeImage, alt: "" });
    getAdminWorksMock.mockRejectedValue(new Error("down"));

    renderSettings();

    const current = await screen.findByRole("region", { name: "Imagem atual" });
    expect(await within(current).findByText("w1")).toBeInTheDocument();
    expect(within(current).getByText("Sem texto alternativo")).toBeInTheDocument();
    expect(
      within(current).getByRole("img", {
        name: "Imagem atual da Home do trabalho w1",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Não foi possível carregar as imagens disponíveis."),
    ).toBeInTheDocument();
  });

  it("exibe o estado vazio quando image é null e nenhuma radio marcada", async () => {
    getHomeImageMock.mockResolvedValue(null);
    getAdminWorksMock.mockResolvedValue(works);

    renderSettings();

    expect(
      await screen.findByText("Nenhuma imagem da Home definida"),
    ).toBeInTheDocument();
    const radios = await screen.findAllByRole("radio");
    expect(radios).toHaveLength(3);
    radios.forEach((radio) => expect(radio).not.toBeChecked());
    expect(screen.queryByText("Na Home")).not.toBeInTheDocument();
  });

  it("exibe o estado vazio de candidatas com link para Trabalhos", async () => {
    getHomeImageMock.mockResolvedValue(null);
    getAdminWorksMock.mockResolvedValue([
      makeWork("draft", { status: "draft" }),
    ]);

    renderSettings();

    expect(await screen.findByText("Nenhuma imagem elegível")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para Trabalhos" }),
    ).toHaveAttribute("href", "/admin/trabalhos");
    expect(screen.queryByRole("button", SAVE)).not.toBeInTheDocument();
  });

  it("erro ao carregar a imagem atual não esconde as candidatas e permite retry", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockRejectedValueOnce(createAxiosError(500));
    getAdminWorksMock.mockResolvedValue(works);

    renderSettings();

    expect(
      await screen.findByText("Não foi possível carregar a imagem atual da Home."),
    ).toBeInTheDocument();
    expect(await screen.findAllByRole("radio")).toHaveLength(3);

    getHomeImageMock.mockResolvedValueOnce(activeImage);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByRole("radio", {
        name: "imagem 1: Banco dianteiro em couro (imagem atual da Home)",
      }),
    ).toBeChecked();
    expect(getHomeImageMock).toHaveBeenCalledTimes(2);
  });

  it("erro nas candidatas não esconde a imagem atual e permite retry", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockRejectedValueOnce(new Error("down"));

    renderSettings();

    expect(
      await screen.findByText("Não foi possível carregar as imagens disponíveis."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Banco dianteiro em couro" }),
    ).toBeInTheDocument();

    getAdminWorksMock.mockResolvedValueOnce(works);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findAllByRole("radio")).toHaveLength(3);
  });

  it("navega pelas opções com as setas do teclado", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockResolvedValue(works);

    renderSettings();

    const activeRadio = await screen.findByRole("radio", {
      name: "imagem 1: Banco dianteiro em couro (imagem atual da Home)",
    });
    activeRadio.focus();
    await user.keyboard("{ArrowRight}");

    const second = screen.getByRole("radio", {
      name: "imagem 2 do trabalho Bancos em couro",
    });
    expect(second).toHaveFocus();
    expect(second).toBeChecked();
    expect(
      screen.getByText("Selecionada: imagem 2 do trabalho Bancos em couro"),
    ).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("radio", { name: "imagem 1: Painel em madeira" }),
    ).toBeChecked();
  });

  it("desfaz a seleção e volta para a imagem ativa", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockResolvedValue(works);

    renderSettings();

    await user.click(
      await screen.findByRole("radio", { name: "imagem 1: Painel em madeira" }),
    );
    expect(screen.getByRole("button", SAVE)).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Desfazer seleção" }));

    expect(
      screen.getByRole("radio", {
        name: "imagem 1: Banco dianteiro em couro (imagem atual da Home)",
      }),
    ).toBeChecked();
    expect(screen.getByRole("button", SAVE)).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Desfazer seleção" }),
    ).not.toBeInTheDocument();
  });

  it("mantém Salvar desabilitado ao reselecionar a imagem ativa", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockResolvedValue(works);

    renderSettings();

    await user.click(
      await screen.findByRole("radio", { name: "imagem 1: Painel em madeira" }),
    );
    await user.click(
      screen.getByRole("radio", {
        name: "imagem 1: Banco dianteiro em couro (imagem atual da Home)",
      }),
    );

    expect(screen.getByRole("button", SAVE)).toBeDisabled();
    expect(screen.getByText("Nenhuma alteração")).toBeInTheDocument();
  });

  it("salva com o body exato, atualiza o cache, mostra toast e foca o heading", async () => {
    const user = userEvent.setup();
    const saved: HomeImage = {
      workId: "w2",
      imageId: "b1",
      url: "https://res.cloudinary.com/demo/image/upload/b1.jpg",
      alt: "Painel em madeira",
    };
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockResolvedValue(works);
    const pending = deferred<HomeImage>();
    setHomeImageMock.mockReturnValue(pending.promise);

    renderSettings();

    await user.click(
      await screen.findByRole("radio", { name: "imagem 1: Painel em madeira" }),
    );
    await user.click(screen.getByRole("button", SAVE));

    // Durante o envio: botão e opções desabilitados.
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    screen.getAllByRole("radio").forEach((radio) => expect(radio).toBeDisabled());

    // Duplo envio bloqueado.
    await user.click(screen.getByRole("button", { name: "Salvando..." }));
    expect(setHomeImageMock).toHaveBeenCalledTimes(1);
    expect(setHomeImageMock).toHaveBeenCalledWith({
      workId: "w2",
      imageId: "b1",
    });

    pending.resolve(saved);

    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith("Imagem da Home atualizada."),
    );
    expect(queryClient.getQueryData(["home-image"])).toEqual(saved);
    expect(
      screen.getByRole("heading", { level: 2, name: "Imagem atual" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("radio", {
        name: "imagem 1: Painel em madeira (imagem atual da Home)",
      }),
    ).toBeChecked();
    expect(screen.getAllByText("Na Home")).toHaveLength(1);
    expect(screen.getByText("Nenhuma alteração")).toBeInTheDocument();
    expect(screen.getByRole("button", SAVE)).toBeDisabled();
    expect(getHomeImageMock).toHaveBeenCalledTimes(1);
  });

  it("bloqueia envio duplo síncrono do formulário", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockResolvedValue(works);
    setHomeImageMock.mockReturnValue(new Promise(() => undefined));

    renderSettings();

    await user.click(
      await screen.findByRole("radio", { name: "imagem 1: Painel em madeira" }),
    );
    const form = screen.getByRole("button", SAVE).closest("form");
    expect(form).not.toBeNull();
    form?.requestSubmit();
    form?.requestSubmit();

    await waitFor(() => expect(setHomeImageMock).toHaveBeenCalledTimes(1));
  });

  it.each([
    [404, "Imagem ou trabalho não encontrado. A lista foi atualizada."],
    [
      409,
      "Este trabalho não está mais publicado. A lista foi atualizada; escolha outra imagem.",
    ],
  ])(
    "em %i exibe a mensagem inline e recarrega candidatas e imagem atual",
    async (status, message) => {
      const user = userEvent.setup();
      getHomeImageMock.mockResolvedValue(activeImage);
      getAdminWorksMock.mockResolvedValueOnce(works);
      setHomeImageMock.mockRejectedValue(createAxiosError(status));

      renderSettings();

      await user.click(
        await screen.findByRole("radio", { name: "imagem 1: Painel em madeira" }),
      );

      // Após o refetch, o work w2 deixou de ser elegível.
      getAdminWorksMock.mockResolvedValueOnce([
        works[0],
        makeWork("w2", { status: "draft", title: "Painel restaurado" }),
      ]);
      await user.click(screen.getByRole("button", SAVE));

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      await waitFor(() => expect(getAdminWorksMock).toHaveBeenCalledTimes(2));
      expect(getHomeImageMock).toHaveBeenCalledTimes(2);
      expect(toastErrorMock).not.toHaveBeenCalled();
      expect(toastSuccessMock).not.toHaveBeenCalled();

      // Seleção derivada: a candidata sumiu → volta à ativa, sem alteração.
      await waitFor(() =>
        expect(
          screen.queryByRole("radio", { name: "imagem 1: Painel em madeira" }),
        ).not.toBeInTheDocument(),
      );
      expect(
        screen.getByRole("radio", {
          name: "imagem 1: Banco dianteiro em couro (imagem atual da Home)",
        }),
      ).toBeChecked();
      expect(screen.getByRole("button", SAVE)).toBeDisabled();
      expect(screen.getByRole("alert")).toHaveTextContent(message);
    },
  );

  it("em 409, se a imagem ativa deixou de ser elegível (GET /home-image → image: null), exibe o estado vazio e nenhuma opção ativa", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValueOnce(activeImage);
    getAdminWorksMock.mockResolvedValueOnce(works);
    setHomeImageMock.mockRejectedValue(createAxiosError(409));

    renderSettings();

    await user.click(
      await screen.findByRole("radio", { name: "imagem 1: Painel em madeira" }),
    );

    // Contrato: a referência salva é revalidada a cada leitura pública; o
    // work w1 foi despublicado, então GET /home-image passa a responder null.
    getHomeImageMock.mockResolvedValueOnce(null);
    getAdminWorksMock.mockResolvedValueOnce([
      makeWork("w1", { status: "draft", title: "Bancos em couro" }),
      works[1],
    ]);
    await user.click(screen.getByRole("button", SAVE));

    expect(
      await screen.findByText("Nenhuma imagem da Home definida"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("radio", {
          name: "imagem 1: Banco dianteiro em couro (imagem atual da Home)",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Na Home")).not.toBeInTheDocument();
    // A seleção pendente (w2/b1) continua válida e agora difere da ativa (null).
    expect(
      screen.getByRole("radio", { name: "imagem 1: Painel em madeira" }),
    ).toBeChecked();
    expect(screen.getByRole("button", SAVE)).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Este trabalho não está mais publicado. A lista foi atualizada; escolha outra imagem.",
    );
  });

  it("marca a seção de candidatas com aria-busy durante o refetch", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockRejectedValueOnce(new Error("down"));

    renderSettings();

    const section = await screen.findByRole("region", {
      name: /Imagens disponíveis/,
    });
    await screen.findByText("Não foi possível carregar as imagens disponíveis.");
    expect(section).toHaveAttribute("aria-busy", "false");

    const pending = deferred<Work[]>();
    getAdminWorksMock.mockReturnValueOnce(pending.promise);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(section).toHaveAttribute("aria-busy", "true");

    pending.resolve(works);
    await waitFor(() => expect(section).toHaveAttribute("aria-busy", "false"));
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("em outros erros exibe a mensagem sem recarregar e limpa o erro ao trocar a seleção", async () => {
    const user = userEvent.setup();
    getHomeImageMock.mockResolvedValue(activeImage);
    getAdminWorksMock.mockResolvedValue(works);
    setHomeImageMock.mockRejectedValue(createAxiosError(429));

    renderSettings();

    await user.click(
      await screen.findByRole("radio", { name: "imagem 1: Painel em madeira" }),
    );
    await user.click(screen.getByRole("button", SAVE));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
    );
    expect(getAdminWorksMock).toHaveBeenCalledTimes(1);
    expect(getHomeImageMock).toHaveBeenCalledTimes(1);
    // Mantém a seleção para nova tentativa.
    expect(
      screen.getByRole("radio", { name: "imagem 1: Painel em madeira" }),
    ).toBeChecked();
    expect(screen.getByRole("button", SAVE)).toBeEnabled();

    await user.click(
      screen.getByRole("radio", { name: "imagem 2 do trabalho Bancos em couro" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
