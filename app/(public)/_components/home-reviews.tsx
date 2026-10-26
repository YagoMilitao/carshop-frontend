import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { PageSection } from "@/components/layout/page-section"
import { formatCommentDate } from "../_lib/format-comment-date"
import type { HomeReview } from "../_lib/select-home-reviews"

type HomeReviewsProps = {
  reviews: readonly HomeReview[]
}

/**
 * `#reviews`: comentários reais aprovados como prova social (CARSHOP-170).
 * Tratamento contido em superfície aquecida, layout aberto com divisores —
 * sem aspas decorativas, estrelas, médias, contadores ou avatares (não há
 * rating nos dados). Conteúdo sempre renderizado como texto, nunca HTML.
 * Sem reviews a seção (e a âncora `#reviews`) é omitida.
 */
export function HomeReviews({ reviews }: Readonly<HomeReviewsProps>) {
  if (reviews.length === 0) {
    return null
  }

  return (
    <PageSection
      spacing="standard"
      container="page"
      id="reviews"
      aria-labelledby="reviews-heading"
      className="bg-surface-warm"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        <h2
          id="reviews-heading"
          className="text-heading-2 text-foreground lg:col-span-4 lg:self-start"
        >
          Reviews
        </h2>

        <ul className="flex max-w-2xl flex-col divide-y divide-border lg:col-span-8">
          {reviews.map((review) => (
            <li key={review.id} className="py-8 first:pt-0 last:pb-0 lg:py-10">
              <figure className="flex flex-col gap-5">
                <blockquote>
                  <p className="whitespace-pre-line text-body-lg text-foreground">
                    {review.content}
                  </p>
                </blockquote>
                <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-body font-medium text-foreground">
                    {review.reviewerName}
                  </span>
                  <span aria-hidden="true" className="text-body-sm text-muted-foreground">
                    ·
                  </span>
                  <time
                    dateTime={review.createdAt}
                    className="text-body-sm text-muted-foreground"
                  >
                    {formatCommentDate(review.createdAt)}
                  </time>
                  <span aria-hidden="true" className="text-body-sm text-muted-foreground">
                    ·
                  </span>
                  <Link
                    href={`/portfolio/${review.work.slug}`}
                    className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-nav text-foreground outline-hidden hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring"
                  >
                    {review.work.title}
                    <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
                  </Link>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </PageSection>
  )
}
