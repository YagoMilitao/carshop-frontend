import Link from "next/link";

import { Button } from "@/components/ui/button";

import {
  COMMENT_FILTER_STATUSES,
  buildCommentsHref,
  type CommentFilterStatus,
} from "./comment-filters";
import { commentFilterLabels } from "./comment-status";

/**
 * Filtro por status via links (estado na URL: `?status=`). Sem
 * `"use client"`: a navegação é feita pelo `Link`, e a página (Server
 * Component) relê `searchParams`. Os links omitem `page`, então trocar o
 * filtro sempre volta para a página 1.
 */
export function CommentStatusFilter({
  current,
}: Readonly<{ current: CommentFilterStatus }>) {
  return (
    <nav aria-label="Filtrar comentários por status">
      <ul className="flex flex-wrap gap-2">
        {COMMENT_FILTER_STATUSES.map((status) => {
          const isActive = status === current;

          return (
            <li key={status}>
              <Button
                asChild
                size="sm"
                variant={isActive ? "default" : "outline"}
              >
                <Link
                  href={buildCommentsHref({ status })}
                  scroll={false}
                  aria-current={isActive ? "page" : undefined}
                >
                  {commentFilterLabels[status]}
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
