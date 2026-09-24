import { describe, expect, it } from "vitest";

import {
  COMMENT_FILTER_STATUSES,
  DEFAULT_COMMENT_FILTER_STATUS,
  buildCommentsHref,
  parseCommentFilters,
  toApiStatus,
} from "./comment-filters";

describe("parseCommentFilters", () => {
  it("usa PENDING e página 1 quando nada é informado", () => {
    expect(parseCommentFilters({})).toEqual({ status: "PENDING", page: 1 });
    expect(DEFAULT_COMMENT_FILTER_STATUS).toBe("PENDING");
  });

  it.each(COMMENT_FILTER_STATUSES)("aceita o status válido %s", (status) => {
    expect(parseCommentFilters({ status }).status).toBe(status);
  });

  it.each(["pending", "INVALID", "", "hidden "])(
    "cai para PENDING com status inválido %j",
    (status) => {
      expect(parseCommentFilters({ status }).status).toBe("PENDING");
    },
  );

  it("usa o primeiro valor quando os params vêm repetidos (array)", () => {
    expect(
      parseCommentFilters({ status: ["APPROVED", "HIDDEN"], page: ["3", "5"] }),
    ).toEqual({ status: "APPROVED", page: 3 });
  });

  it("cai para os padrões quando o array vem vazio", () => {
    expect(parseCommentFilters({ status: [], page: [] })).toEqual({
      status: "PENDING",
      page: 1,
    });
  });

  it("aceita página inteira positiva", () => {
    expect(parseCommentFilters({ page: "2" }).page).toBe(2);
    expect(parseCommentFilters({ page: "10" }).page).toBe(10);
  });

  it.each([
    ["0", 1],
    ["-1", 1],
    ["-3", 1],
    ["1.5", 1],
    ["2.0", 1],
    ["abc", 1],
    ["", 1],
    ["1e3", 1],
    [" 2", 1],
    ["99999999999999999999", 1],
  ])("página %j inválida → %i", (page, expected) => {
    expect(parseCommentFilters({ page }).page).toBe(expected);
  });

  it("página ausente → 1", () => {
    expect(parseCommentFilters({ page: undefined }).page).toBe(1);
  });
});

describe("buildCommentsHref", () => {
  it("omite status padrão e página 1", () => {
    expect(buildCommentsHref({ status: "PENDING" })).toBe("/admin/comentarios");
    expect(buildCommentsHref({ status: "PENDING", page: 1 })).toBe(
      "/admin/comentarios",
    );
  });

  it("inclui status não padrão", () => {
    expect(buildCommentsHref({ status: "APPROVED" })).toBe(
      "/admin/comentarios?status=APPROVED",
    );
    expect(buildCommentsHref({ status: "ALL" })).toBe(
      "/admin/comentarios?status=ALL",
    );
  });

  it("inclui página > 1", () => {
    expect(buildCommentsHref({ status: "PENDING", page: 2 })).toBe(
      "/admin/comentarios?page=2",
    );
    expect(buildCommentsHref({ status: "HIDDEN", page: 3 })).toBe(
      "/admin/comentarios?status=HIDDEN&page=3",
    );
  });

  it("omite página <= 1", () => {
    expect(buildCommentsHref({ status: "APPROVED", page: 0 })).toBe(
      "/admin/comentarios?status=APPROVED",
    );
  });
});

describe("toApiStatus", () => {
  it("ALL → undefined (sem filtro na API)", () => {
    expect(toApiStatus("ALL")).toBeUndefined();
  });

  it.each(["PENDING", "APPROVED", "HIDDEN"] as const)(
    "%s é repassado como está",
    (status) => {
      expect(toApiStatus(status)).toBe(status);
    },
  );
});
