import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ContainerVariant = "page" | "reading"

type ContainerProps<T extends ElementType = "div"> = {
  variant?: ContainerVariant
  as?: T
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className" | "variant">

export function Container<T extends ElementType = "div">({
  variant,
  as,
  className,
  children,
  ...props
}: Readonly<ContainerProps<T>>) {
  const Component: ElementType = as ?? "div"
  const resolvedVariant: ContainerVariant = variant ?? "page"

  return (
    <Component
      className={cn(
        resolvedVariant === "page"
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
