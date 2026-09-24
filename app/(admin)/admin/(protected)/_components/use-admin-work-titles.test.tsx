import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Work } from "@/lib/api/works";

const getAdminWorksMock = vi.fn<() => Promise<Work[]>>();

vi.mock("@/lib/api/works.client", () => ({
  adminWorksQueryKey: ["admin", "works"],
  getAdminWorks: () => getAdminWorksMock(),
}));

import { useAdminWorkTitles } from "./use-admin-work-titles";

function makeWork(id: string, title: string): Work {
  return {
    id,
    slug: id,
    title,
    description: "Descrição",
    category: "Estofamento",
    tags: [],
    images: [],
    status: "published",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
  };
}

let queryClient: QueryClient;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAdminWorkTitles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("retorna undefined enquanto a query não resolve", () => {
    getAdminWorksMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useAdminWorkTitles(), { wrapper });

    expect(result.current).toBeUndefined();
  });

  it("mapeia id → título a partir da listagem admin de works", async () => {
    getAdminWorksMock.mockResolvedValue([
      makeWork("work-1", "Restauração Fusca"),
      makeWork("work-2", "Bancos em couro"),
    ]);

    const { result } = renderHook(() => useAdminWorkTitles(), { wrapper });

    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current).toBeInstanceOf(Map);
    expect(result.current?.get("work-1")).toBe("Restauração Fusca");
    expect(result.current?.get("work-2")).toBe("Bancos em couro");
    expect(result.current?.size).toBe(2);
  });

  it("compartilha a query key adminWorksQueryKey (reusa o cache sem nova chamada)", () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData<Work[]>(
      ["admin", "works"],
      [makeWork("work-9", "Do cache")],
    );

    const { result } = renderHook(() => useAdminWorkTitles(), { wrapper });

    expect(result.current?.get("work-9")).toBe("Do cache");
    expect(getAdminWorksMock).not.toHaveBeenCalled();
  });

  it("permanece undefined (não bloqueante) quando a listagem falha", async () => {
    getAdminWorksMock.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAdminWorkTitles(), { wrapper });

    await waitFor(() =>
      expect(
        queryClient.getQueryState(["admin", "works"])?.status,
      ).toBe("error"),
    );
    expect(result.current).toBeUndefined();
  });
});
