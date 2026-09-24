/**
 * Formato de data dos comentários no admin, compartilhado entre a moderação
 * (`CommentListItem`) e a lista de pendentes do dashboard.
 */
export const commentDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
