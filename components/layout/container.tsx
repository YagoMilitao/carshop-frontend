import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ContainerVariant = "page" | "reading"

interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  variant?: ContainerVariant
  as?: ElementType
  children: ReactNode
}

export function Container({
  variant = "page",
  as: Component = "div",
  className,
  children,
  ...props
}: Readonly<ContainerProps>) {
  return (
    <Component
      className={cn(
        variant === "page"
          ? "container-page px-5 sm:px-8 lg:px-16 xl:px-20"
          : "container-reading",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
