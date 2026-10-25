import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getHomeImage,
  HOME_IMAGE_REQUEST_TIMEOUT_MS,
  HOME_IMAGE_RETRY_OPTIONS,
  HOME_IMAGE_REVALIDATE_SECONDS,
} from "./home-image.server";

/** Ver `works.test.ts`: `server-only` lança sob Vitest/Node; mock no-op. */
vi.mock("server-only", () => ({}));

const configuredImage = {
  workId: "work-1",
  imageId: "img-1",
  url: "https://res.cloudinary.com/demo/image/upload/v1/home.jpg",
  alt: "Banco de couro restaurado",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("lib/api/home-image.server", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("usa o orçamento reduzido de retry documentado", () => {
    expect(HOME_IMAGE_RETRY_OPTIONS).toEqual({ retries: 1, baseDelayMs: 500 });
    expect(HOME_IMAGE_REVALIDATE_SECONDS).toBe(300);
    expect(HOME_IMAGE_REQUEST_TIMEOUT_MS).toBe(5_000);
  });

  it("busca `GET /home-image` com tags e revalidate e retorna a imagem", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ image: configuredImage }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getHomeImage()).resolves.toEqual(configuredImage);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(input)).toMatch(/\/home-image$/);
    expect(init).toEqual(
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        next: {
          revalidate: HOME_IMAGE_REVALIDATE_SECONDS,
          tags: ["home-image", "works"],
        },
      }),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retorna null para `{ image: null }`", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ image: null })),
    );

    await expect(getHomeImage()).resolves.toBeNull();
  });

  it("retorna null para um `200` malformado", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ image: { url: 1 } })),
    );

    await expect(getHomeImage()).resolves.toBeNull();
  });

  it.each([429, 500])(
    "lança HttpError %i após exatamente 2 tentativas",
    async (status) => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockImplementation(async () => new Response(null, { status }));
      vi.stubGlobal("fetch", fetchMock);

      const assertion = expect(getHomeImage()).rejects.toMatchObject({
        name: "HttpError",
        status,
      });
      await vi.runAllTimersAsync();
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("lança após um retry quando a rede falha", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(getHomeImage()).rejects.toThrow("fetch failed");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recupera quando o retry tem sucesso", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ image: configuredImage }));
    vi.stubGlobal("fetch", fetchMock);

    const resultPromise = getHomeImage();
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual(configuredImage);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("não repete um 404", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getHomeImage()).rejects.toMatchObject({
      name: "HttpError",
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborta uma tentativa que excede o timeout", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn<typeof fetch>((_input, init) => {
      const signal = init?.signal;

      if (!signal) {
        return Promise.reject(new Error("AbortSignal ausente"));
      }

      signals.push(signal);

      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(getHomeImage()).rejects.toBeDefined();
    await vi.advanceTimersByTimeAsync(HOME_IMAGE_REQUEST_TIMEOUT_MS - 1);
    expect(signals[0]?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(signals[0]?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(500 + HOME_IMAGE_REQUEST_TIMEOUT_MS);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(signals[1]?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
