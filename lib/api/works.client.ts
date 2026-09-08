import { http } from "@/lib/api/http";
import type { Work } from "@/lib/api/works";

/**
 * Camada de acesso a dados de mutações admin de `Work` (Axios, via
 * instância única de `lib/api/http.ts` — ADR-001). Leitura pública
 * continua em `lib/api/works.ts` (`fetch`, Server Components).
 */

export type CreateWorkPayload = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: Work["status"];
};

/** `POST /works` (admin, autenticado). */
export async function createWork(payload: CreateWorkPayload): Promise<Work> {
  const response = await http.post<Work>("/works", payload);

  return response.data;
}

/** `DELETE /admin/works/:workId` (admin, autenticado). */
export async function deleteWork(workId: string): Promise<void> {
  await http.delete(`/admin/works/${workId}`);
}
