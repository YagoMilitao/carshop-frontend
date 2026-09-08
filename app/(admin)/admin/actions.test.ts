import { beforeEach, describe, expect, it, vi } from "vitest";

// `./actions` importa `workCommentsTag` de `lib/api/comments.ts`
// (`import "server-only"`) — mockado como no-op, mesmo padrão de
// `lib/api/works.test.ts`.
vi.mock("server-only", () => ({}));

const updateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  updateTag: (...args: unknown[]) => updateTagMock(...args),
}));

import { revalidateCommentsTag, revalidateWorksTag } from "./actions";
import { workCommentsTag } from "@/lib/api/comments";

describe("app/(admin)/admin/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("revalidateWorksTag", () => {
    it("chama updateTag('works')", async () => {
      await revalidateWorksTag();

      expect(updateTagMock).toHaveBeenCalledWith("works");
    });
  });

  describe("revalidateCommentsTag", () => {
    it("chama updateTag com a tag de comentários do work", async () => {
      await revalidateCommentsTag("work-1");

      expect(updateTagMock).toHaveBeenCalledWith(workCommentsTag("work-1"));
    });
  });
});
