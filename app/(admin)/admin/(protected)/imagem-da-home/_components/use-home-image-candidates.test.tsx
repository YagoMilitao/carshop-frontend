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

import { makeWork } from "./home-image.test-helpers";
import { useHomeImageCandidates } from "./use-home-image-candidates";

let queryClient: QueryClient;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useHomeImageCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("começa pendente, sem grupos", () => {
    getAdminWorksMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useHomeImageCandidates(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.groups).toBeUndefined();
  });

  it("filtra a listagem admin para as candidatas elegíveis", async () => {
    getAdminWorksMock.mockResolvedValue([
      makeWork("ok"),
      makeWork("draft", { status: "draft" }),
    ]);

    const { result } = renderHook(() => useHomeImageCandidates(), { wrapper });

    await waitFor(() => expect(result.current.groups).toBeDefined());
    expect(result.current.groups?.map((group) => group.workId)).toEqual(["ok"]);
    expect(result.current.error).toBeNull();
  });

  it("reutiliza o cache pré-populado de ['admin','works'] sem nova chamada", () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData<Work[]>(["admin", "works"], [makeWork("cached")]);

    const { result } = renderHook(() => useHomeImageCandidates(), { wrapper });

    expect(result.current.groups?.map((group) => group.workId)).toEqual([
      "cached",
    ]);
    expect(getAdminWorksMock).not.toHaveBeenCalled();
  });

  it("expõe o erro e permite refetch", async () => {
    getAdminWorksMock.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useHomeImageCandidates(), { wrapper });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    getAdminWorksMock.mockResolvedValueOnce([makeWork("depois")]);
    await result.current.refetch();

    await waitFor(() =>
      expect(result.current.groups?.map((group) => group.workId)).toEqual([
        "depois",
      ]),
    );
    expect(getAdminWorksMock).toHaveBeenCalledTimes(2);
  });
});
