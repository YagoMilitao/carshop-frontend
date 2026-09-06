import type { MetadataRoute } from 'next'
import { clientEnv } from '@/lib/env/client'

const staticRoutes: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '/', changeFrequency: 'weekly' },
  { path: '/about', changeFrequency: 'monthly' },
  { path: '/services', changeFrequency: 'monthly' },
  { path: '/portfolio', changeFrequency: 'weekly' },
  { path: '/contact', changeFrequency: 'monthly' },
]

// TODO: incluir entradas de `/portfolio/[slug]` quando a API de projetos
// existir e permitir listar os slugs reais publicados.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return staticRoutes.map(({ path, changeFrequency }) => ({
    url: new URL(path, clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
    lastModified,
    changeFrequency,
  }))
}
