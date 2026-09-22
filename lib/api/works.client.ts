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

/**
 * Localiza um `Work` pelo `slug` dentro de uma listagem já carregada
 * (função pura, sem I/O). Usada pela edição admin (CARSHOP-32) sobre o
 * resultado de `getAdminWorks()` — que já inclui rascunhos — em vez de uma
 * nova chamada HTTP dedicada a busca por slug (que não existe no backend).
 */
export function findAdminWorkBySlug(
  works: Work[],
  slug: string,
): Work | undefined {
  return works.find((work) => work.slug === slug);
}

/**
 * Payload de atualização de `Work`, a confirmar/ajustar quando o contrato
 * real de `PATCH` (CARSHOP-135) for documentado. Hoje reaproveita a mesma
 * forma do payload de criação porque não há contrato real ainda.
 */
export type UpdateWorkPayload = CreateWorkPayload;

/**
 * Atualização de `Work` (CARSHOP-32) está bloqueada: a CARSHOP-135, que
 * definiria o contrato real de `PATCH` de update, não está implementada
 * nem documentada em nenhum lugar do repositório (sem
 * `docs/api-contract.md`, sem Swagger consultável, sem código de backend
 * disponível). Por regra do CLAUDE.md ("backend contract rule"), nenhum
 * contrato pode ser inventado — por isso esta função não realiza nenhuma
 * chamada HTTP e apenas lança um erro explicativo. Deve ser implementada
 * de fato somente quando a CARSHOP-135 for confirmada/documentada.
 */
export function updateWork(
  workId: string,
  payload: UpdateWorkPayload,
): Promise<Work> {
  return Promise.reject(
    new Error(
      `Atualização de trabalhos indisponível (work "${workId}", payload com ${
        Object.keys(payload).length
      } campos): aguardando contrato real da CARSHOP-135 (PATCH de update de Work).`,
    ),
  );
}
