import type { MetadataRoute } from 'next'
import { clientEnv } from '@/lib/env/client'
import { getWorks } from '@/lib/api/works'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const staticEntries = staticRoutes.map(({ path, changeFrequency }) => ({
    url: new URL(path, clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
    lastModified,
    changeFrequency,
  }))

  const works = await getWorks()

  const workEntries = works
    .filter((work) => work.status === 'published')
    .map((work) => ({
      url: new URL(
        `/portfolio/${work.slug}`,
        clientEnv.NEXT_PUBLIC_SITE_URL,
      ).toString(),
      lastModified: new Date(work.updatedAt),
    }))

  return [...staticEntries, ...workEntries]
}
