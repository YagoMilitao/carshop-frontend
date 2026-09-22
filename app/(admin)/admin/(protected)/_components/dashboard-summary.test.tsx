import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Work } from "@/lib/api/works";
import type { AdminCommentListResponse } from "@/lib/api/comments.client";

const getAdminWorksMock = vi.fn<() => Promise<Work[]>>();
const getAdminCommentsMock =
  vi.fn<
    (params: {
      status?: string;
      page?: number;
      limit?: number;
    }) => Promise<AdminCommentListResponse>
  >();

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  getAdminWorks: () => getAdminWorksMock(),
}));

vi.mock("@/lib/api/comments.client", () => ({
  adminCommentsQueryKey: (status?: string, page?: number, limit?: number) => [
    "admin",
    "comments",
    status,
    { page, limit },
  ],
  getAdminComments: (params: {
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    getAdminCommentsMock(params),
}));

import { DashboardSummary } from "./dashboard-summary";

const publishedWork: Work = {
  id: "1",
  slug: "restauracao-fusca",
  title: "Restauração Fusca",
  description: "Descrição",
  category: "Estofamento",
  tags: ["fusca"],
  images: [],
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

function renderDashboardSummary() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardSummary />
    </QueryClientProvider>,
  );
}

describe("DashboardSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcula total de works e publicados vs. rascunho a partir de getAdminWorks", async () => {
    getAdminWorksMock.mockResolvedValue([
      publishedWork,
      { ...publishedWork, id: "2", status: "draft" },
      { ...publishedWork, id: "3", status: "draft" },
    ]);
    getAdminCommentsMock.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 4,
      totalPages: 1,
    });

    renderDashboardSummary();

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(getAdminCommentsMock).toHaveBeenCalledWith({
      status: "PENDING",
      page: 1,
      limit: 20,
    });
  });

  it("exibe mensagem de erro no card quando a busca de works falha", async () => {
    getAdminWorksMock.mockRejectedValue(new Error("network down"));
    getAdminCommentsMock.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

    renderDashboardSummary();

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });

  it("exibe mensagem de erro no card quando a busca de comentários pendentes falha", async () => {
    getAdminWorksMock.mockResolvedValue([publishedWork]);
    getAdminCommentsMock.mockRejectedValue(new Error("network down"));

    renderDashboardSummary();

    expect(await screen.findByText("1")).toBeInTheDocument();

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[alerts.length - 1]).toHaveTextContent(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
