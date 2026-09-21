import { http } from "@/lib/api/http";
import type { Work } from "@/lib/api/works";

/**
 * Camada de acesso a dados administrativos de `Work` (Axios, via
 * instância única de `lib/api/http.ts` — ADR-001). Leitura pública
 * continua em `lib/api/works.ts` (`fetch`, Server Components).
 */

export type CreateWorkPayload = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: Work["status"];
};

export const adminWorksQueryKey = ["admin", "works"] as const;

/** `GET /works?includeDrafts=true` (admin, autenticado). */
export async function getAdminWorks(): Promise<Work[]> {
  const response = await http.get<Work[]>("/works", {
    params: { includeDrafts: true },
  });

  return response.data;
}

/** `POST /works` (admin, autenticado). */
export async function createWork(payload: CreateWorkPayload): Promise<Work> {
  const response = await http.post<Work>("/works", payload);

  return response.data;
}

/** `DELETE /admin/works/:workId` (admin, autenticado). */
export async function deleteWork(workId: string): Promise<void> {
  await http.delete(`/admin/works/${workId}`);
}
