/**
 * Tipos do recurso "imagem principal da Home" (CARSHOP-159, backend
 * `GET /home-image` e `PATCH /admin/home-image`). Apenas tipos por ora:
 * o fetch server-side (Home pública) chega com CARSHOP-161.
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
