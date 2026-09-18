import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCoverImage, getWorkBySlug, getWorks } from '@/lib/api/works'
import { getWorkComments, type Comment } from '@/lib/api/comments'
import { WorkGallery } from '@/components/gallery/work-gallery'
import { ErrorToast } from '@/components/feedback/error-toast'
import { Container } from '@/components/layout/container'
import { PageSection } from '@/components/layout/page-section'
import { CommentForm } from './comment-form'

type ProjectDetailsPageProps = {
  params: Promise<{ slug: string }>
}

const commentDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

function formatCommentDate(isoDate: string): string {
  return commentDateFormatter.format(new Date(isoDate))
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

  let comments: Comment[] = []
  let commentsErrorMessage: string | null = null

  try {
    comments = await getWorkComments(work.id)
  } catch (error) {
    console.error(
      `Falha ao buscar comentários do work ${work.id}:`,
      error,
    )
    commentsErrorMessage =
      'Não foi possível carregar os comentários agora. Tente novamente mais tarde.'
  }

  return (
    <>
      <PageSection spacing="editorial" container="reading">
        <span className="text-label text-muted-foreground">
          {work.category}
        </span>
        <h1 className="mt-2 text-display-lg text-foreground">
          {work.title}
        </h1>
        <p className="mt-6 text-body-lg text-secondary-foreground">
          {work.description}
        </p>
      </PageSection>

      <PageSection spacing="compact" container="none">
        <Container variant="page">
          <WorkGallery images={work.images} fallbackAlt={work.title} />
        </Container>
      </PageSection>

      <PageSection
        as="section"
        spacing="standard"
        container="reading"
        aria-labelledby="comments-heading"
      >
        <h2 id="comments-heading" className="text-heading-2 text-foreground">
          Comentários
        </h2>

        {commentsErrorMessage && (
          <ErrorToast message={commentsErrorMessage} />
        )}

        {comments.length === 0 ? (
          <p className="mt-6 text-body text-secondary-foreground">
            Ainda não há comentários aprovados para este projeto.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col divide-y divide-border">
            {comments.map((comment) => (
              <li key={comment.id} className="flex flex-col gap-1 py-6 first:pt-0">
                <p className="text-body font-semibold text-foreground">
                  {comment.authorName}
                </p>
                <p className="text-body text-secondary-foreground">
                  {comment.content}
                </p>
                <p className="text-body-sm text-muted-foreground">
                  <time dateTime={comment.createdAt}>
                    {formatCommentDate(comment.createdAt)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <CommentForm workId={work.id} />
        </div>
      </PageSection>
    </>
  )
}
