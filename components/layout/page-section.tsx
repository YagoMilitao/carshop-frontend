import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Container } from "./container"

type SectionSpacing = "compact" | "standard" | "editorial"
type SectionContainer = "page" | "reading" | "none"

type PageSectionProps<T extends ElementType = "section"> = {
  spacing?: SectionSpacing
  container?: SectionContainer
  as?: T
  className?: string
  children: ReactNode
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "children" | "className" | "container" | "spacing"
>

const spacingClassNames: Record<SectionSpacing, string> = {
  compact: "py-12 lg:py-16",
  standard: "py-16 lg:py-28",
  editorial: "py-20 lg:py-36",
}

export function PageSection<T extends ElementType = "section">({
  spacing,
  container,
  as,
  className,
  children,
  ...props
}: Readonly<PageSectionProps<T>>) {
  const Component: ElementType = as ?? "section"
  const resolvedSpacing: SectionSpacing = spacing ?? "standard"
  const resolvedContainer: SectionContainer = container ?? "page"
  const content: ReactNode = children

  return (
    <Component className={cn(spacingClassNames[resolvedSpacing], className)} {...props}>
      {resolvedContainer === "none" ? (
        content
      ) : (
        <Container variant={resolvedContainer}>{content}</Container>
      )}
    </Component>
  )
}
