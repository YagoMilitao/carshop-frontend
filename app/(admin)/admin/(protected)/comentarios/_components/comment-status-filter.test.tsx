import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { CommentStatusFilter } from "./comment-status-filter";

describe("CommentStatusFilter", () => {
  it("renderiza um nav rotulado com os quatro filtros e seus hrefs", () => {
    render(<CommentStatusFilter current="PENDING" />);

    const nav = screen.getByRole("navigation", {
      name: "Filtrar comentários por status",
    });
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Pendentes",
      "Aprovados",
      "Ocultos",
      "Todos",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin/comentarios",
      "/admin/comentarios?status=APPROVED",
      "/admin/comentarios?status=HIDDEN",
      "/admin/comentarios?status=ALL",
    ]);
  });

  it("os hrefs nunca incluem page (trocar filtro volta à página 1)", () => {
    render(<CommentStatusFilter current="APPROVED" />);

    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toContain("page=");
    }
  });

  it.each([
    ["PENDING", "Pendentes"],
    ["APPROVED", "Aprovados"],
    ["HIDDEN", "Ocultos"],
    ["ALL", "Todos"],
  ] as const)(
    "marca apenas %s com aria-current='page'",
    (current, activeLabel) => {
      render(<CommentStatusFilter current={current} />);

      for (const link of screen.getAllByRole("link")) {
        if (link.textContent === activeLabel) {
          expect(link).toHaveAttribute("aria-current", "page");
        } else {
          expect(link).not.toHaveAttribute("aria-current");
        }
      }
    },
  );
});
