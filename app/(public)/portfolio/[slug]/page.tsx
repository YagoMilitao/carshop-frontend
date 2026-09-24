import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCoverImage, getWorkBySlug, getWorks } from '@/lib/api/works'
import { getWorkComments, type Comment } from '@/lib/api/comments'
import { PageSection } from '@/components/layout/page-section'
import { BackToPortfolioLink } from './_components/back-to-portfolio-link'
import { ProjectComments } from './_components/project-comments'
import { ProjectGallery } from './_components/project-gallery'
import { buildProjectGallery } from './_lib/build-project-gallery'

type ProjectDetailsPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const works = await getWorks()

    return works.map((work) => ({ slug: work.slug }))
  } catch (error) {
    console.error(
      'Falha ao buscar works para generateStaticParams de /portfolio/[slug]:',
      error,
    )

    return []
  }
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
      ...(cover
        ? { images: [{ url: cover.url, alt: cover.alt || work.title }] }
        : {}),
    },
    alternates: {
      canonical: `/portfolio/${slug}`,
    },
  }
}

/**
 * Sem `try/catch` em `getWorkBySlug`: falhas propagam para `error.tsx`, e
 * `undefined` (404 do backend) vira `notFound()` → `not-found.tsx` com
 * HTTP 404 real. Não adicionar `loading.tsx`/`Suspense` neste segmento ou
 * acima: o streaming começaria antes do `notFound()` (soft-404).
 */
export default async function ProjectDetailsPage({
  params,
}: Readonly<ProjectDetailsPageProps>) {
  const { slug } = await params
  const work = await getWorkBySlug(slug)

  if (!work) {
    notFound()
  }

  let comments: Comment[] = []
  let commentsFailed = false

  try {
    comments = await getWorkComments(work.id)
  } catch (error) {
    console.error(
      `Falha ao buscar comentários do work ${work.id}:`,
      error,
    )
    commentsFailed = true
  }

  const layout = buildProjectGallery(work)

  return (
    <>
      <PageSection spacing="compact" container="page">
        <article aria-labelledby="project-title">
          <BackToPortfolioLink />

          <header className="mt-8 flex max-w-4xl flex-col lg:mt-12">
            <span className="text-label text-muted-foreground">
              {work.category}
            </span>
            <h1
              id="project-title"
              className="mt-3 text-display-lg text-foreground"
            >
              {work.title}
            </h1>
            <p className="mt-6 max-w-2xl whitespace-pre-line text-body-lg text-secondary-foreground">
              {work.description}
            </p>
          </header>

          {layout.hero && (
            <section
              aria-labelledby="project-photos-heading"
              className="mt-10 lg:mt-16"
            >
              <h2 id="project-photos-heading" className="sr-only">
                Project photos
              </h2>
              <ProjectGallery layout={layout} fallbackAlt={work.title} />
            </section>
          )}
        </article>
      </PageSection>

      <PageSection
        as="section"
        spacing="standard"
        container="page"
        aria-labelledby="comments-heading"
      >
        <div className="border-t border-border pt-10 lg:pt-12">
          <div className="max-w-2xl">
            <ProjectComments
              workId={work.id}
              comments={comments}
              failed={commentsFailed}
            />
          </div>
        </div>
      </PageSection>
    </>
  )
}
