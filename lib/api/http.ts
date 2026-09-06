import axios from "axios";

import { clientEnv } from "@/lib/env/client";

/**
 * Instância única do Axios para chamadas HTTP client-side (ADR-001):
 * nenhuma feature deve instanciar Axios diretamente ou usar `fetch` para
 * o mesmo propósito no cliente. Server Components/fetching server-side
 * usam `fetch` nativo do Next, fora deste módulo.
 */
export const http = axios.create({
  baseURL: clientEnv.NEXT_PUBLIC_API_URL,
});
