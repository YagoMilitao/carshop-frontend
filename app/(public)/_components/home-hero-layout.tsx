"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { LuArrowRight } from "react-icons/lu"
import { cn } from "@/lib/utils"

export type HeroMediaCandidate = {
  image: {
    url: string
    alt: string
  }
  caption: {
    category: string
    title: string
    href: string
  } | null
}

type HomeHeroLayoutProps = {
  candidates: readonly HeroMediaCandidate[]
  children: ReactNode
}

const HERO_IMAGE_SIZES =
  "(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 100vw"

export function HomeHeroLayout({
  candidates,
  children,
}: Readonly<HomeHeroLayoutProps>) {
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const imageRef = useRef<HTMLImageElement>(null)
  const activeIndex = candidates.findIndex(
    (candidate) => !failedUrls.has(candidate.image.url),
  )
  const active = activeIndex >= 0 ? candidates[activeIndex] : null

  const markAsFailed = useCallback((url: string) => {
    setFailedUrls((current) => {
      if (current.has(url)) return current

      const next = new Set(current)
      next.add(url)
      return next
    })
  }, [])

  useEffect(() => {
    const image = imageRef.current

    // O erro pode ocorrer antes da hidratação e, nesse caso, `onError` não é
    // reproduzido pelo React. `currentSrc` evita considerar imagens ainda não
    // iniciadas (e o DOM de teste) como falhas.
    if (
      active &&
      image?.complete &&
      image.currentSrc &&
      image.naturalWidth === 0
    ) {
      const failedUrl = active.image.url
      const timeoutId = window.setTimeout(() => markAsFailed(failedUrl), 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [active, markAsFailed])

  const media = active ? (
    <>
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
        <Image
          ref={imageRef}
          key={active.image.url}
          src={active.image.url}
          alt={active.image.alt}
          fill
          sizes={HERO_IMAGE_SIZES}
          preload={activeIndex === 0}
          loading={activeIndex === 0 ? undefined : "eager"}
          className="object-cover"
          onError={() => markAsFailed(active.image.url)}
        />
      </div>
      {active.caption && (
        <figcaption className="flex flex-col gap-1">
          <span className="text-label text-muted-foreground">
            {active.caption.category}
          </span>
          <Link
            href={active.caption.href}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-body font-semibold text-foreground outline-hidden hover:text-primary focus-visible:ring-3 focus-visible:ring-focus-ring"
          >
            {active.caption.title}
            <LuArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        </figcaption>
      )}
    </>
  ) : null

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-10",
        active && "lg:grid-cols-12 lg:items-center lg:gap-12",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-6",
          active ? "lg:col-span-5" : "max-w-5xl",
        )}
      >
        {children}
      </div>

      {active &&
        (active.caption ? (
          <figure className="flex flex-col gap-3 lg:col-span-7">{media}</figure>
        ) : (
          <div className="flex flex-col gap-3 lg:col-span-7">{media}</div>
        ))}
    </div>
  )
}
