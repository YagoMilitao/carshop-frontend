import "server-only";

import { z } from "zod";

import { clientEnv } from "./client";

/**
 * Variáveis server-only (sem prefixo `NEXT_PUBLIC_`, nunca vão para o
 * bundle do cliente). Hoje não há nenhuma variável server-only exclusiva
 * neste módulo — schema vazio como placeholder pronto para uso futuro
 * (ex.: chaves de serviço, URLs internas). `OBSIDIAN_VAULT_ID` é lido
 * diretamente por agentes de automação, fora do runtime da aplicação
 * Next.js, e por isso não entra aqui.
 */
const serverEnvSchema = z.object({});

serverEnvSchema.parse({});

/**
 * Único ponto de leitura de env para uso em Server Components, Route
 * Handlers e services (futuros). Reaproveita `clientEnv` já validado em
 * vez de reler `process.env.NEXT_PUBLIC_API_URL` diretamente.
 */
export const serverEnv = {
  apiUrl: clientEnv.NEXT_PUBLIC_API_URL,
};

export type ServerEnv = typeof serverEnv;
