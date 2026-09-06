import { z } from "zod";

/**
 * Variáveis expostas ao bundle do navegador (prefixo `NEXT_PUBLIC_`).
 * Nunca adicionar aqui nenhuma variável sensível/credencial — tudo que
 * entra neste schema é embutido no bundle client-side pelo Next.js.
 *
 * Único ponto de leitura de `process.env.NEXT_PUBLIC_API_URL` e
 * `process.env.NEXT_PUBLIC_SITE_URL` do projeto: nenhum outro arquivo deve
 * ler essas variáveis diretamente.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

// Parse no top-level: falha rápido (build/runtime) se a env estiver
// ausente ou mal formada, em vez de falhar silenciosamente em uso futuro.
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
