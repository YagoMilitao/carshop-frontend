import "server-only";

import { cache } from "react";
import { serverEnv } from "@/lib/env/server";
import { HttpError } from "./errors";
import { withRetryBackoff } from "./retry";

/**
 * Camada de acesso a dados do recurso `Work` (backend `carshop-backend`).
 * Usa `fetch` nativo do Next para Server Components — nunca a instância
 * Axios de `lib/api/http.ts`, que é explicitamente client-side only
 * (ADR-001).
 */

export type WorkStatus = "published" | "draft";

export type WorkImage = {
  id: string;
  url: string;
  publicId: string;
  alt: string;
  isCover: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Work = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: WorkImage[];
  status: WorkStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/**
 * Tempo de revalidação (ISR) para dados de `Work`, em segundos (1 hora).
 * Compartilhado entre listagem, detalhe e sitemap para manter a mesma
 * chave de cache do Next Data Cache (`tags: ['works']`).
 */
export const WORKS_REVALIDATE_SECONDS = 3600;

/** Limite de duração de cada tentativa individual de `GET /works` e `GET /works/{slug}`. */
export const WORKS_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Busca a listagem completa de `Work`s publicados via `GET /works`
 * (público, sem paginação, filtrado por padrão para `status: 'published'`
 * pelo backend).
 */
export async function getWorks(): Promise<Work[]> {
  return withRetryBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      WORKS_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${serverEnv.apiUrl}/works`, {
        // Um signal novo evita a memoização por render do React entre retries;
        // `next` mantém o cache ISR como uma camada separada.
        signal: controller.signal,
        next: { revalidate: WORKS_REVALIDATE_SECONDS, tags: ["works"] },
      });

      if (!response.ok) {
        throw new HttpError(
          `Falha ao buscar works: ${response.status}`,
          response.status,
        );
      }

      return (await response.json()) as Work[];
    } finally {
      clearTimeout(timeoutId);
    }
  });
}

/**
 * Busca um `Work` publicado pelo `slug` via `GET /works/{slug}` (público;
 * o backend responde `404` para slugs inexistentes, rascunhos e works
 * removidos).
 *
 * - `404` → `undefined` (sem retry); a página chama `notFound()`.
 * - Demais respostas não-ok → `HttpError` (5xx/429 e erros de rede são
 *   repetidos por `withRetryBackoff`; outros 4xx não).
 *
 * Envolvida em `React.cache()` para deduplicar `generateMetadata` e a
 * página no mesmo request: a memoização nativa do `fetch` é desativada
 * quando há `signal`, e o Next Data Cache só armazena respostas `200`.
 */
export const getWorkBySlug = cache(
  async (slug: string): Promise<Work | undefined> =>
    withRetryBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        WORKS_REQUEST_TIMEOUT_MS,
      );

      try {
        const response = await fetch(
          `${serverEnv.apiUrl}/works/${encodeURIComponent(slug)}`,
          {
            signal: controller.signal,
            next: { revalidate: WORKS_REVALIDATE_SECONDS, tags: ["works"] },
          },
        );

        if (response.status === 404) {
          return undefined;
        }

        if (!response.ok) {
          throw new HttpError(
            `Failed to fetch work "${slug}": ${response.status}`,
            response.status,
          );
        }

        return (await response.json()) as Work;
      } finally {
        clearTimeout(timeoutId);
      }
    }),
);

/**
 * Resolve a imagem de capa de um `Work` (`images.find(i => i.isCover)`).
 */
export function getCoverImage(work: Work): WorkImage | undefined {
  return work.images.find((image) => image.isCover);
}
