import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCoverImage, getWorkBySlug, getWorks } from '@/lib/api/works'

type ProjectDetailsPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const works = await getWorks()

  return works.map((work) => ({ slug: work.slug }))
}

export async function generateMetadata({
  params,
}: ProjectDetailsPageProps): Promise<Metadata> {
  const { slug } = await params
  const work = await getWorkBySlug(slug)

  if (!work) {
    notFound()
  }

  const cover = getCoverImage(work)

  return {
    title: `${work.title} — CarShop`,
    description: work.description,
    openGraph: {
      title: `${work.title} — CarShop`,
      description: work.description,
      type: 'article',
      ...(cover ? { images: [{ url: cover.url, alt: cover.alt }] } : {}),
    },
    alternates: {
      canonical: `/portfolio/${slug}`,
    },
  }
}

export default async function ProjectDetailsPage({
  params,
}: Readonly<ProjectDetailsPageProps>) {
  const { slug } = await params
  const work = await getWorkBySlug(slug)

  if (!work) {
    notFound()
  }

  return (
    <main>
      <h1>{work.title}</h1>
      <p>{work.description}</p>
    </main>
  )
}
