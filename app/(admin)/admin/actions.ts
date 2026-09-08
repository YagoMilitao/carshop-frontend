"use server";

import { updateTag } from "next/cache";

import { workCommentsTag } from "@/lib/api/comments";

/**
 * Server Actions restritas a invalidação do Next Data Cache. **Nunca**
 * chamam o backend Express diretamente — as mutações reais (create/delete
 * work, upload/delete imagem, moderar comentário) são feitas client-side
 * via Axios (`lib/api/*.client.ts`), seguidas da action correspondente
 * aqui para invalidar o cache de leitura pública.
 *
 * Desvio do plano original (`revalidateTag`, assinatura de versões
 * anteriores do Next): nesta versão instalada (`next@^16.3.4`),
 * `revalidateTag(tag)` de 1 argumento não existe mais — passou a exigir um
 * segundo argumento (`profile`/`cacheLife`). `updateTag(tag)` é o
 * substituto direto para uso em Server Actions (semântica
 * read-your-own-writes, mesmo propósito do plano), então foi usado aqui em
 * seu lugar.
 */

export async function revalidateWorksTag(): Promise<void> {
  updateTag("works");
}

export async function revalidateCommentsTag(workId: string): Promise<void> {
  updateTag(workCommentsTag(workId));
}
