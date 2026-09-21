import "server-only";

import { z } from "zod";

import { clientEnv } from "./client";

/**
 * Variáveis server-only (sem prefixo `NEXT_PUBLIC_`, nunca vão para o
 * bundle do cliente). `OBSIDIAN_VAULT_ID` é lido diretamente por agentes
 * de automação, fora do runtime da aplicação Next.js, e por isso não
 * entra aqui.
 *
 * `SOCIAL_*_URL` são opcionais por decisão de produto (CARSHOP-133): o
 * footer público só deve exibir cada link de rede social quando a URL
 * real do perfil estiver configurada — a ausência da variável não é um
 * erro de configuração, é o estado padrão até o negócio fornecer os
 * perfis reais.
 */
const serverEnvSchema = z.object({
  SOCIAL_INSTAGRAM_URL: z.string().url().optional(),
  SOCIAL_FACEBOOK_URL: z.string().url().optional(),
  SOCIAL_LINKEDIN_URL: z.string().url().optional(),
});

const parsedServerEnv = serverEnvSchema.parse({
  SOCIAL_INSTAGRAM_URL: process.env.SOCIAL_INSTAGRAM_URL,
  SOCIAL_FACEBOOK_URL: process.env.SOCIAL_FACEBOOK_URL,
  SOCIAL_LINKEDIN_URL: process.env.SOCIAL_LINKEDIN_URL,
});

/**
 * Único ponto de leitura de env para uso em Server Components, Route
 * Handlers e services (futuros). Reaproveita `clientEnv` já validado em
 * vez de reler `process.env.NEXT_PUBLIC_API_URL` diretamente.
 */
export const serverEnv = {
  apiUrl: clientEnv.NEXT_PUBLIC_API_URL,
  social: {
    instagramUrl: parsedServerEnv.SOCIAL_INSTAGRAM_URL,
    facebookUrl: parsedServerEnv.SOCIAL_FACEBOOK_URL,
    linkedinUrl: parsedServerEnv.SOCIAL_LINKEDIN_URL,
  },
};

export type ServerEnv = typeof serverEnv;
