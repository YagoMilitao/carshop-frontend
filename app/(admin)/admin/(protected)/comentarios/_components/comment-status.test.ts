import { describe, expect, it } from "vitest";

import {
  commentFilterLabels,
  commentStatusBadgeVariants,
  commentStatusLabels,
} from "./comment-status";

describe("comment-status", () => {
  it("mapeia os rótulos de status em pt-BR", () => {
    expect(commentStatusLabels).toEqual({
      PENDING: "Pendente",
      APPROVED: "Aprovado",
      HIDDEN: "Oculto",
    });
  });

  it("mapeia as variantes do Badge por status", () => {
    expect(commentStatusBadgeVariants).toEqual({
      PENDING: "outline",
      APPROVED: "success",
      HIDDEN: "secondary",
    });
  });

  it("mapeia os rótulos dos filtros, incluindo Todos", () => {
    expect(commentFilterLabels).toEqual({
      PENDING: "Pendentes",
      APPROVED: "Aprovados",
      HIDDEN: "Ocultos",
      ALL: "Todos",
    });
  });
});
