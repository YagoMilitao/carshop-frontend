/**
 * Hosts remotos aceitos por `next/image` na Home pública.
 *
 * Deve espelhar exatamente `images.remotePatterns` em `next.config.mjs`.
 * Uma URL fora desta lista faria `next/image` lançar no render; a Home
 * trata essa URL como ausente e usa o fallback (CARSHOP-161).
 */
const ALLOWED_REMOTE_IMAGE_HOSTS: readonly string[] = ["res.cloudinary.com"]

export function isAllowedRemoteImageUrl(url: string): boolean {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  return parsed.protocol === "https:" && ALLOWED_REMOTE_IMAGE_HOSTS.includes(parsed.hostname)
}
