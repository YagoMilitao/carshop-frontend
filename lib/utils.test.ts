import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cn, TYPOGRAPHY_UTILITIES } from "./utils";

const classes = (value: string): string[] => value.split(" ");

describe("cn", () => {
  it("mantém text-button junto de uma cor de texto", () => {
    expect(classes(cn("text-button", "text-primary-foreground"))).toEqual([
      "text-button",
      "text-primary-foreground",
    ]);
  });

  it.each(TYPOGRAPHY_UTILITIES)(
    "mantém text-%s junto de uma cor de texto (em qualquer ordem)",
    (name) => {
      expect(classes(cn(`text-${name}`, "text-foreground"))).toEqual([
        `text-${name}`,
        "text-foreground",
      ]);
      expect(classes(cn("text-muted-foreground", `text-${name}`))).toEqual([
        "text-muted-foreground",
        `text-${name}`,
      ]);
    },
  );

  it("trata utilitários tipográficos como font-size: o último vence", () => {
    expect(cn("text-button", "text-xs")).toBe("text-xs");
    expect(cn("text-xs", "text-button")).toBe("text-button");
    expect(cn("text-body", "text-heading-2")).toBe("text-heading-2");
    expect(cn("text-button", "text-[0.8rem]")).toBe("text-[0.8rem]");
  });

  it("respeita variantes ao resolver conflitos", () => {
    expect(cn("text-body", "md:text-heading-3", "md:text-sm")).toBe(
      "text-body md:text-sm",
    );
  });

  it("preserva o comportamento padrão do tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("text-primary", "text-primary-foreground")).toBe(
      "text-primary-foreground",
    );
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
    expect(cn("p-2", false, null, undefined, { "m-1": true, "m-2": false })).toBe(
      "p-2 m-1",
    );
  });

  it("cobre todos os @utility text-* declarados em app/globals.css", () => {
    const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
    const declared = [...css.matchAll(/@utility text-([\w-]+)\s*\{/g)].map(
      (match) => match[1],
    );

    expect([...declared].sort()).toEqual([...TYPOGRAPHY_UTILITIES].sort());
  });
});
