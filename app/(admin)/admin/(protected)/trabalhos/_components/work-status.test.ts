import { describe, expect, it } from "vitest";

import {
  workStatusBadgeVariants,
  workStatusLabels,
  workStatusOptions,
} from "./work-status";

describe("work-status", () => {
  it("usa rótulos em inglês (Published/Draft), nunca o enum cru", () => {
    expect(workStatusLabels).toEqual({ published: "Published", draft: "Draft" });
  });

  it("mapeia variantes semânticas do Badge (published → success, draft → secondary)", () => {
    expect(workStatusBadgeVariants).toEqual({
      published: "success",
      draft: "secondary",
    });
  });

  it("ordena as opções do formulário com rascunho primeiro", () => {
    expect(workStatusOptions).toEqual(["draft", "published"]);
  });
});
