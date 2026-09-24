import { describe, expect, it } from "vitest";

import { commentDateFormatter } from "./comment-date";

describe("commentDateFormatter", () => {
  it("usa locale pt-BR com data e hora curtas", () => {
    const options = commentDateFormatter.resolvedOptions();

    expect(options.locale).toBe("pt-BR");
    expect(options.dateStyle).toBe("short");
    expect(options.timeStyle).toBe("short");
  });

  it("formata no padrão dd/mm/aaaa, hh:mm", () => {
    const expected = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(2024, 0, 2, 15, 4));

    expect(commentDateFormatter.format(new Date(2024, 0, 2, 15, 4))).toBe(
      expected,
    );
    expect(expected).toMatch(/^02\/01\/2024,? 15:04$/);
  });
});
