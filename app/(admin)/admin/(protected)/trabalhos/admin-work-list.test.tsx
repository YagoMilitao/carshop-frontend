import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Work } from "@/lib/api/works";

const getAdminWorksMock = vi.fn<() => Promise<Work[]>>();

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  getAdminWorks: () => getAdminWorksMock(),
}));

vi.mock("./work-list-item", () => ({
  WorkListItem: ({ work }: { work: Work }) => (
    <li data-testid="work-list-item">
      {work.title} — {work.status}
    </li>
  ),
}));

import { AdminWorkList } from "./admin-work-list";

const draftWork: Work = {
  id: "1",
  slug: "restauracao-fusca",
  title: "Restauração Fusca",
  description: "Descrição",
  category: "Estofamento",
  tags: ["fusca"],
  images: [],
  status: "draft",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

function renderAdminWorkList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminWorkList />
    </QueryClientProvider>,
  );
}

describe("AdminWorkList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe o estado de carregamento", () => {
    getAdminWorksMock.mockReturnValue(new Promise(() => undefined));

    renderAdminWorkList();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando trabalhos...",
    );
  });

  it("renderiza trabalhos publicados e rascunhos", async () => {
    getAdminWorksMock.mockResolvedValue([
      draftWork,
      { ...draftWork, id: "2", title: "Outro Work", status: "published" },
    ]);

    renderAdminWorkList();

    expect(await screen.findAllByTestId("work-list-item")).toHaveLength(2);
    expect(screen.getByText("Restauração Fusca — draft")).toBeInTheDocument();
    expect(screen.getByText("Outro Work — published")).toBeInTheDocument();
  });

  it("exibe mensagem quando não há trabalhos", async () => {
    getAdminWorksMock.mockResolvedValue([]);

    renderAdminWorkList();

    expect(
      await screen.findByText("Nenhum trabalho cadastrado."),
    ).toBeInTheDocument();
  });

  it("exibe mensagem amigável quando a listagem falha", async () => {
    getAdminWorksMock.mockRejectedValue(new Error("network down"));

    renderAdminWorkList();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });

  it("permite tentar novamente após falha e exibe a lista ao recuperar", async () => {
    getAdminWorksMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce([draftWork]);
    const user = userEvent.setup();

    renderAdminWorkList();

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findAllByTestId("work-list-item")).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getAdminWorksMock).toHaveBeenCalledTimes(2);
  });
});
