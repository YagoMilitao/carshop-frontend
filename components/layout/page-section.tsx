import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Container } from "./container"

type SectionSpacing = "compact" | "standard" | "editorial"
type SectionContainer = "page" | "reading" | "none"

interface PageSectionProps extends ComponentPropsWithoutRef<"section"> {
  spacing?: SectionSpacing
  container?: SectionContainer
  as?: ElementType
  children: ReactNode
}

const spacingClassNames: Record<SectionSpacing, string> = {
  compact: "py-12 lg:py-16",
  standard: "py-16 lg:py-28",
  editorial: "py-20 lg:py-36",
}

export function PageSection({
  spacing = "standard",
  container = "page",
  as: Component = "section",
  className,
  children,
  ...props
}: Readonly<PageSectionProps>) {
  return (
    <Component className={cn(spacingClassNames[spacing], className)} {...props}>
      {container === "none" ? children : <Container variant={container}>{children}</Container>}
    </Component>
  )
}
