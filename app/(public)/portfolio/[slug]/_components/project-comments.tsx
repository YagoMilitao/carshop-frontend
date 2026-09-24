import type { Comment } from "@/lib/api/comments"
import { ErrorToast } from "@/components/feedback/error-toast"
import { CommentForm } from "../comment-form"

const COMMENTS_ERROR_MESSAGE =
  "We couldn't load comments right now. Please try again later."

const commentDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

function formatCommentDate(isoDate: string): string {
  return commentDateFormatter.format(new Date(isoDate))
}

type ProjectCommentsProps = {
  workId: string
  comments: readonly Comment[]
  /** `true` quando `GET /works/:id/comments` falhou (estado degradado). */
  failed: boolean
}

/**
 * Comentários aprovados + formulário. Subordinados à fotografia e sem
 * tratamento de testimonial (sem aspas, estrelas ou contagem). O conteúdo
 * é sempre renderizado como texto (nunca HTML).
 */
export function ProjectComments({
  workId,
  comments,
  failed,
}: Readonly<ProjectCommentsProps>) {
  return (
    <>
      <h2 id="comments-heading" className="text-heading-3 text-foreground">
        Comments
      </h2>

      {failed && (
        <>
          <ErrorToast message={COMMENTS_ERROR_MESSAGE} />
          <p className="mt-6 text-body text-secondary-foreground">
            {COMMENTS_ERROR_MESSAGE}
          </p>
        </>
      )}

      {!failed && comments.length === 0 && (
        <p className="mt-6 text-body text-secondary-foreground">
          No comments yet.
        </p>
      )}

      {!failed && comments.length > 0 && (
        <ul className="mt-6 flex flex-col divide-y divide-border">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0"
            >
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-body font-medium text-foreground">
                  {comment.authorName}
                </span>
                <time
                  dateTime={comment.createdAt}
                  className="text-body-sm text-muted-foreground"
                >
                  {formatCommentDate(comment.createdAt)}
                </time>
              </p>
              <p className="whitespace-pre-line text-body text-secondary-foreground">
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 flex flex-col gap-2">
        <h3 className="text-heading-4 text-foreground">Leave a comment</h3>
        <p className="text-body-sm text-muted-foreground">
          Comments are reviewed before they appear on this page.
        </p>
        <div className="mt-4">
          <CommentForm workId={workId} />
        </div>
      </div>
    </>
  )
}
