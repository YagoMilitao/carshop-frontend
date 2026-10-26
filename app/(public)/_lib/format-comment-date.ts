const commentDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

/**
 * Data longa en-US em UTC (ex. `June 5, 2026`) para comentários públicos.
 * UTC fixo evita divergência entre o render no servidor e o fuso do
 * visitante. Compartilhado entre `/portfolio/[slug]` e a Home (`#reviews`).
 */
export function formatCommentDate(isoDate: string): string {
  return commentDateFormatter.format(new Date(isoDate))
}
