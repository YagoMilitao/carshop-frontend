import { z } from "zod";

/**
 * Variáveis expostas ao bundle do navegador (prefixo `NEXT_PUBLIC_`).
 * Nunca adicionar aqui nenhuma variável sensível/credencial — tudo que
 * entra neste schema é embutido no bundle client-side pelo Next.js.
 *
 * Único ponto de leitura de `process.env.NEXT_PUBLIC_API_URL` e
 * `process.env.NEXT_PUBLIC_SITE_URL` do projeto: nenhum outro arquivo da
 * aplicação deve ler essas variáveis diretamente. `next.config.mjs` é uma
 * exceção documentada (roda fora do runtime Next/React, na camada de
 * configuração/build) — usa `process.env.NEXT_PUBLIC_API_URL` diretamente
 * para montar o proxy de dev em `rewrites()`.
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
