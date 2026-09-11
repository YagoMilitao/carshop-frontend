import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCoverImage, getWorkBySlug, getWorks } from '@/lib/api/works'
import { getWorkComments } from '@/lib/api/comments'
import { CommentForm } from './comment-form'

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

  const comments = await getWorkComments(work.id)

  return (
    <div>
      <h1>{work.title}</h1>
      <p>{work.description}</p>

      <section aria-labelledby="comments-heading">
        <h2 id="comments-heading">Comentários</h2>

        {comments.length === 0 ? (
          <p>Ainda não há comentários aprovados para este projeto.</p>
        ) : (
          <ul>
            {comments.map((comment) => (
              <li key={comment.id}>
                <p className="font-medium">{comment.authorName}</p>
                <p>{comment.content}</p>
              </li>
            ))}
          </ul>
        )}

        <CommentForm workId={work.id} />
      </section>
    </div>
  )
}
