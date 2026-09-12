import { HttpError } from "./errors";

/**
 * Utilitário de retry com backoff exponencial, agnóstico de transporte:
 * recebe apenas uma função `() => Promise<T>` e a re-executa em caso de
 * falha, sem conhecer se a operação usa `fetch` (server-side) ou Axios
 * (client-side). Preserva a fronteira do ADR-001 — quem chama decide o
 * transporte, este utilitário só decide "quando" repetir.
 */
export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

const DEFAULT_RETRIES = 4;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 8000;

/**
 * Regra default de `shouldRetry`: repete em erro de rede (ex.
 * `TypeError`/timeout do `fetch` rejeitado, que não chega a produzir uma
 * `Response`) e em `HttpError` com `status >= 500` ou `status === 429`.
 * Não repete em outros erros 4xx (falha do cliente, não do backend).
 */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 500 || error.status === 429;
  }

  // Erro de rede/timeout (ex. `fetch` rejeitado, `TypeError: fetch failed`)
  // não é uma `HttpError` — não há status HTTP, então tratamos como
  // condição transitória e repetimos.
  return true;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function computeDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponentialDelay = baseDelayMs * 2 ** attempt;

  return Math.min(exponentialDelay, maxDelayMs);
}

/**
 * Executa `operation`, repetindo em caso de falha conforme `shouldRetry`,
 * com backoff exponencial entre tentativas. Lança o último erro caso as
 * tentativas se esgotem.
 */
export async function withRetryBackoff<T>(
  operation: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const shouldRetry = options?.shouldRetry ?? defaultShouldRetry;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === retries;

      if (isLastAttempt || !shouldRetry(error)) {
        throw error;
      }

      await wait(computeDelayMs(attempt, baseDelayMs, maxDelayMs));
    }
  }

  // Inalcançável: o loop sempre retorna ou lança no último `attempt`.
  throw lastError;
}
