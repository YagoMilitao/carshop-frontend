import { createCn } from "cn/config"
import type { CnFunction } from "cn"

/**
 * Custom typography utilities declared with `@utility text-*` in
 * app/globals.css. Each one sets font-size (plus family, weight and
 * line-height), so they belong to the `font-size` class group.
 *
 * Without this extension the merger classifies unknown `text-*` names as
 * text colors, and `cn("text-button", "text-primary-foreground")` silently
 * drops `text-button`. Keep this list in sync with app/globals.css.
 */
export const TYPOGRAPHY_UTILITIES = [
  "display-xl",
  "display-lg",
  "heading-1",
  "heading-2",
  "heading-3",
  "heading-4",
  "body-lg",
  "body",
  "body-sm",
  "label",
  "nav",
  "button",
] as const

/** Project-wide class merger. Always import `cn` from here, never from "cn". */
export const cn: CnFunction = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TYPOGRAPHY_UTILITIES] }],
    },
  },
})
