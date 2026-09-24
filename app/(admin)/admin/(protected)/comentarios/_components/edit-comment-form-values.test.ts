import { describe, expect, it } from "vitest";

import type { Comment } from "@/lib/api/comments";

import {
  buildUpdateCommentPayload,
  editCommentSchema,
  mapCommentToFormValues,
} from "./edit-comment-form-values";

const comment: Comment = {
  id: "c-1",
  workId: "work-1",
  authorName: "Cliente",
  content: "Ficou incrível!",
  status: "PENDING",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function firstIssue(input: unknown) {
  const result = editCommentSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0];
}

describe("editCommentSchema", () => {
  const valid = { authorName: "Ana", content: "Bom trabalho", status: "APPROVED" };

  it("aceita valores válidos e aplica trim", () => {
    expect(
      editCommentSchema.parse({
        authorName: "  Ana  ",
        content: "  Bom  ",
        status: "PENDING",
      }),
    ).toEqual({ authorName: "Ana", content: "Bom", status: "PENDING" });
  });

  it("aceita os limites exatos (2/80 e 3/1000)", () => {
    expect(
      editCommentSchema.safeParse({ ...valid, authorName: "ab" }).success,
    ).toBe(true);
    expect(
      editCommentSchema.safeParse({ ...valid, authorName: "a".repeat(80) })
        .success,
    ).toBe(true);
    expect(editCommentSchema.safeParse({ ...valid, content: "abc" }).success).toBe(
      true,
    );
    expect(
      editCommentSchema.safeParse({ ...valid, content: "a".repeat(1000) })
        .success,
    ).toBe(true);
  });

  it.each([
    [{ authorName: "a" }, "O nome do autor deve ter ao menos 2 caracteres."],
    [{ authorName: "   a  " }, "O nome do autor deve ter ao menos 2 caracteres."],
    [
      { authorName: "a".repeat(81) },
      "O nome do autor deve ter no máximo 80 caracteres.",
    ],
    [{ content: "ab" }, "O comentário deve ter ao menos 3 caracteres."],
    [{ content: "     " }, "O comentário deve ter ao menos 3 caracteres."],
    [
      { content: "a".repeat(1001) },
      "O comentário deve ter no máximo 1000 caracteres.",
    ],
    [{ status: "HIDDEN" }, "Selecione o status."],
  ])("rejeita %j com a mensagem esperada", (override, message) => {
    expect(firstIssue({ ...valid, ...override })?.message).toBe(message);
  });

  it("status é opcional (comentários HIDDEN)", () => {
    expect(
      editCommentSchema.safeParse({ authorName: "Ana", content: "Bom" })
        .success,
    ).toBe(true);
  });
});

describe("mapCommentToFormValues", () => {
  it("mapeia autor, conteúdo e status editável", () => {
    expect(mapCommentToFormValues(comment)).toEqual({
      authorName: "Cliente",
      content: "Ficou incrível!",
      status: "PENDING",
    });
    expect(
      mapCommentToFormValues({ ...comment, status: "APPROVED" }).status,
    ).toBe("APPROVED");
  });

  it("status fica undefined para HIDDEN", () => {
    expect(
      mapCommentToFormValues({ ...comment, status: "HIDDEN" }).status,
    ).toBeUndefined();
  });
});

describe("buildUpdateCommentPayload", () => {
  const unchanged = {
    authorName: comment.authorName,
    content: comment.content,
    status: "PENDING" as const,
  };

  it("retorna null quando nada mudou", () => {
    expect(buildUpdateCommentPayload(comment, unchanged)).toBeNull();
  });

  it("retorna null para HIDDEN sem alterações (status undefined)", () => {
    expect(
      buildUpdateCommentPayload(
        { ...comment, status: "HIDDEN" },
        { authorName: comment.authorName, content: comment.content },
      ),
    ).toBeNull();
  });

  it("envia apenas authorName quando só ele mudou", () => {
    expect(
      buildUpdateCommentPayload(comment, { ...unchanged, authorName: "Ana" }),
    ).toEqual({ authorName: "Ana" });
  });

  it("envia apenas content quando só ele mudou", () => {
    expect(
      buildUpdateCommentPayload(comment, { ...unchanged, content: "Novo texto" }),
    ).toEqual({ content: "Novo texto" });
  });

  it("envia apenas status quando só ele mudou", () => {
    expect(
      buildUpdateCommentPayload(comment, { ...unchanged, status: "APPROVED" }),
    ).toEqual({ status: "APPROVED" });
  });

  it("envia todos os campos alterados", () => {
    expect(
      buildUpdateCommentPayload(comment, {
        authorName: "Ana",
        content: "Novo texto",
        status: "APPROVED",
      }),
    ).toEqual({ authorName: "Ana", content: "Novo texto", status: "APPROVED" });
  });

  it("combina content + status sem authorName", () => {
    expect(
      buildUpdateCommentPayload(comment, {
        ...unchanged,
        content: "Novo texto",
        status: "APPROVED",
      }),
    ).toEqual({ content: "Novo texto", status: "APPROVED" });
  });

  it("nunca envia status para HIDDEN", () => {
    expect(
      buildUpdateCommentPayload(
        { ...comment, status: "HIDDEN" },
        { authorName: "Ana", content: comment.content },
      ),
    ).toEqual({ authorName: "Ana" });
  });
});
