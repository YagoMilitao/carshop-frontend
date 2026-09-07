import "server-only";

import { serverEnv } from "@/lib/env/server";

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

/**
 * Busca a listagem completa de `Work`s publicados via `GET /works`
 * (público, sem paginação, filtrado por padrão para `status: 'published'`
 * pelo backend).
 */
export async function getWorks(): Promise<Work[]> {
  const response = await fetch(`${serverEnv.apiUrl}/works`, {
    next: { revalidate: WORKS_REVALIDATE_SECONDS, tags: ["works"] },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar works: ${response.status}`);
  }

  return (await response.json()) as Work[];
}

/**
 * Mitigação da lacuna de backend (não há `GET /works/:slug` público):
 * busca a listagem completa via `getWorks()` e filtra pelo `slug` no
 * servidor. Não é uma chamada HTTP adicional — reaproveita o Next Data
 * Cache da mesma revalidação.
 */
export async function getWorkBySlug(slug: string): Promise<Work | undefined> {
  const works = await getWorks();

  return works.find((work) => work.slug === slug);
}

/**
 * Resolve a imagem de capa de um `Work` (`images.find(i => i.isCover)`).
 */
export function getCoverImage(work: Work): WorkImage | undefined {
  return work.images.find((image) => image.isCover);
}
