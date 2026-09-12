import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "./errors";
import { withRetryBackoff } from "./retry";

/**
 * `withRetryBackoff` usa `setTimeout` internamente para o backoff entre
 * tentativas — usamos fake timers e `vi.runAllTimersAsync()` para não
 * deixar os testes reais esperarem os delays exponenciais.
 */
describe("lib/api/retry", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolve na primeira tentativa sem repetir quando a operação não falha", async () => {
    const operation = vi.fn().mockResolvedValue("ok");

    const result = await withRetryBackoff(operation);

    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("repete após N falhas retryable e resolve quando a operação finalmente é bem-sucedida", async () => {
    vi.useFakeTimers();

    const operation = vi
      .fn()
      .mockRejectedValueOnce(new HttpError("erro 1", 500))
      .mockRejectedValueOnce(new HttpError("erro 2", 503))
      .mockResolvedValueOnce("ok após retries");

    const resultPromise = withRetryBackoff(operation, {
      retries: 4,
      baseDelayMs: 10,
      maxDelayMs: 1000,
    });

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe("ok após retries");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("esgota as tentativas e lança o último HttpError quando todas as respostas são 5xx", async () => {
    vi.useFakeTimers();

    const finalError = new HttpError("falha definitiva", 500);
    const operation = vi.fn().mockRejectedValue(finalError);

    const resultPromise = withRetryBackoff(operation, {
      retries: 2,
      baseDelayMs: 10,
      maxDelayMs: 1000,
    });

    const assertion = expect(resultPromise).rejects.toBe(finalError);
    await vi.runAllTimersAsync();
    await assertion;

    // `retries: 2` => 1 tentativa inicial + 2 repetições = 3 chamadas.
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("repete em erro de rede (não HttpError) usando a regra default de shouldRetry", async () => {
    vi.useFakeTimers();

    const networkError = new TypeError("fetch failed");
    const operation = vi
      .fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce("recuperado");

    const resultPromise = withRetryBackoff(operation, {
      retries: 3,
      baseDelayMs: 10,
      maxDelayMs: 1000,
    });

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe("recuperado");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("não repete erros HttpError 4xx (exceto 429) — lança imediatamente na primeira falha", async () => {
    const clientError = new HttpError("não autorizado", 401);
    const operation = vi.fn().mockRejectedValue(clientError);

    await expect(withRetryBackoff(operation)).rejects.toBe(clientError);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("repete em HttpError 429 (rate limit) pela regra default de shouldRetry", async () => {
    vi.useFakeTimers();

    const rateLimitError = new HttpError("rate limited", 429);
    const operation = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce("ok");

    const resultPromise = withRetryBackoff(operation, {
      retries: 2,
      baseDelayMs: 10,
      maxDelayMs: 1000,
    });

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("respeita shouldRetry customizado, interrompendo mesmo em erro que seria retryable por padrão", async () => {
    const serverError = new HttpError("erro customizado", 500);
    const operation = vi.fn().mockRejectedValue(serverError);
    const shouldRetry = vi.fn().mockReturnValue(false);

    await expect(
      withRetryBackoff(operation, { shouldRetry }),
    ).rejects.toBe(serverError);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(serverError);
  });

  it("respeita backoff exponencial limitado por maxDelayMs entre tentativas", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    const operation = vi.fn().mockRejectedValue(new HttpError("falha", 500));

    const resultPromise = withRetryBackoff(operation, {
      retries: 3,
      baseDelayMs: 500,
      maxDelayMs: 1200,
    });

    const assertion = expect(resultPromise).rejects.toBeInstanceOf(HttpError);
    await vi.runAllTimersAsync();
    await assertion;

    const delaysUsed = setTimeoutSpy.mock.calls.map(([, delay]) => delay);

    // Backoff exponencial: 500, 1000, min(2000, 1200) = 1200.
    expect(delaysUsed).toEqual([500, 1000, 1200]);
  });

  it("lança o `lastError` (undefined) quando `retries` é negativo e o loop nunca executa", async () => {
    const operation = vi.fn().mockResolvedValue("nunca chamado");

    await expect(
      withRetryBackoff(operation, { retries: -1 }),
    ).rejects.toBeUndefined();

    expect(operation).not.toHaveBeenCalled();
  });
});
