/**
 * Erro de HTTP tipado, usado pelas camadas de acesso a dados (`lib/api/*`)
 * para substituir `throw new Error(...)` genéricos e permitir que
 * utilitários como `withRetryBackoff` (`lib/api/retry.ts`) diferenciem
 * status codes ao decidir se uma requisição deve ser repetida.
 */
export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
