/**
 * Tipos e utilitários isomórficos do recurso "imagem principal da Home"
 * (CARSHOP-159, backend `GET /home-image` e `PATCH /admin/home-image`).
 * Sem `server-only`: este módulo é importado tanto pelo fetch server-side
 * da Home pública (`home-image.server.ts`, CARSHOP-161) quanto pelo código
 * client-side do Admin (`home-image.client.ts`, CARSHOP-160).
 */

/**
 * Imagem gerenciada pelo sistema selecionada para a Home. `url` e `alt`
 * são sempre derivados da imagem armazenada; `alt` pode ser vazio.
 */
export type HomeImage = {
  workId: string;
  imageId: string;
  url: string;
  alt: string;
};

/** `image` é `null` quando nada está configurado ou deixou de ser elegível. */
export type HomeImageResponse = {
  image: HomeImage | null;
};

/**
 * Tag do Next Data Cache do fetch de `GET /home-image`, invalidada pela
 * Server Action `revalidateHomeImageTag` após salvar no Admin.
 */
export const HOME_IMAGE_TAG = "home-image";

function isHomeImage(value: unknown): value is HomeImage {
  return (
    typeof value === "object" &&
    value !== null &&
    "workId" in value &&
    typeof value.workId === "string" &&
    "imageId" in value &&
    typeof value.imageId === "string" &&
    "url" in value &&
    typeof value.url === "string" &&
    "alt" in value &&
    typeof value.alt === "string"
  );
}

/**
 * Valida o corpo de `GET /home-image` em runtime. Retorna a `HomeImage`
 * apenas quando `value.image` tem a forma do contrato; qualquer outro
 * formato (incluindo `{ image: null }` e um `200` malformado) vira `null`,
 * para que a Home degrade para o fallback em vez de quebrar.
 */
export function parseHomeImageResponse(value: unknown): HomeImage | null {
  if (typeof value !== "object" || value === null || !("image" in value)) {
    return null;
  }

  const { image } = value;

  if (!isHomeImage(image)) {
    return null;
  }

  return {
    workId: image.workId,
    imageId: image.imageId,
    url: image.url,
    alt: image.alt,
  };
}
