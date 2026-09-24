import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { WorkImage } from "@/lib/api/works"
import type { ProjectGalleryLayout } from "../_lib/build-project-gallery"
import { ProjectGallery } from "./project-gallery"

function makeImage(id: string, order: number, alt = `Alt ${id}`): WorkImage {
  return {
    id,
    url: `https://res.cloudinary.com/demo/${id}.jpg`,
    publicId: id,
    alt,
    isCover: order === 0,
    order,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  }
}

const hero = makeImage("hero", 0, "Finished front seats")
const wide = makeImage("wide", 1, "Door panel stitching")
const narrow = makeImage("narrow", 2, "")
const solo = makeImage("solo", 3, "Rear bench")

const fullLayout: ProjectGalleryLayout = {
  hero,
  entries: [
    { image: wide, role: "wide", viewerIndex: 1 },
    { image: narrow, role: "narrow", viewerIndex: 2 },
    { image: solo, role: "solo", viewerIndex: 3 },
  ],
  viewerImages: [hero, wide, narrow, solo],
}

const FALLBACK = "Fusca 1978 interior"

describe("ProjectGallery", () => {
  it("não renderiza nada sem hero", () => {
    const { container } = render(
      <ProjectGallery
        layout={{ hero: null, entries: [], viewerImages: [] }}
        fallbackAlt={FALLBACK}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("renderiza hero e sequência na ordem de leitura, com labels em inglês e fallback de alt", () => {
    render(<ProjectGallery layout={fullLayout} fallbackAlt={FALLBACK} />)

    const buttons = screen.getAllByRole("button", { name: /^View image/ })
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "View image 1 of 4: Finished front seats",
      "View image 2 of 4: Door panel stitching",
      `View image 3 of 4: ${FALLBACK}`,
      "View image 4 of 4: Rear bench",
    ])
    expect(screen.getByAltText(FALLBACK)).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("apenas o hero não é lazy; as demais imagens são lazy", () => {
    render(<ProjectGallery layout={fullLayout} fallbackAlt={FALLBACK} />)

    expect(screen.getByAltText("Finished front seats")).not.toHaveAttribute(
      "loading",
      "lazy",
    )
    expect(screen.getByAltText("Door panel stitching")).toHaveAttribute(
      "loading",
      "lazy",
    )
    expect(screen.getByAltText(FALLBACK)).toHaveAttribute("loading", "lazy")
    expect(screen.getByAltText("Rear bench")).toHaveAttribute("loading", "lazy")
  })

  it("aplica frame, span e sizes por papel, sem frames quadrados", () => {
    render(<ProjectGallery layout={fullLayout} fallbackAlt={FALLBACK} />)

    const frameOf = (alt: string) => screen.getByAltText(alt).parentElement

    expect(frameOf("Finished front seats")).toHaveClass(
      "aspect-4/3",
      "md:aspect-video",
    )
    expect(frameOf("Door panel stitching")).toHaveClass("aspect-4/3")
    expect(frameOf(FALLBACK)).toHaveClass("aspect-4/3", "lg:aspect-3/4")
    expect(frameOf("Rear bench")).toHaveClass("aspect-4/3")
    for (const alt of ["Finished front seats", "Door panel stitching", FALLBACK, "Rear bench"]) {
      expect(frameOf(alt)).not.toHaveClass("aspect-square")
    }

    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveClass("lg:col-span-7")
    expect(items[1]).toHaveClass("lg:col-span-5")
    expect(items[2]).toHaveClass("md:col-span-2", "lg:col-span-8")

    expect(screen.getByAltText("Finished front seats")).toHaveAttribute(
      "sizes",
      expect.stringContaining("(min-width: 1280px) 1120px"),
    )
    expect(screen.getByAltText("Rear bench")).toHaveAttribute(
      "sizes",
      expect.stringContaining("(min-width: 1280px) 736px"),
    )
  })

  it("clicar em uma imagem abre o lightbox na imagem correspondente", async () => {
    const user = userEvent.setup()
    render(<ProjectGallery layout={fullLayout} fallbackAlt={FALLBACK} />)

    await user.click(
      screen.getByRole("button", { name: "View image 2 of 4: Door panel stitching" }),
    )

    const dialog = screen.getByRole("dialog")
    expect(
      within(dialog).getByText("Image 2 of 4: Door panel stitching"),
    ).toBeInTheDocument()
    expect(within(dialog).getByAltText("Door panel stitching")).toBeInTheDocument()
  })

  it("navega pelas setas e pelo teclado", async () => {
    const user = userEvent.setup()
    render(<ProjectGallery layout={fullLayout} fallbackAlt={FALLBACK} />)

    await user.click(
      screen.getByRole("button", { name: "View image 1 of 4: Finished front seats" }),
    )
    await user.click(screen.getByRole("button", { name: "Next image" }))
    expect(screen.getByText(/2 \/ 4/)).toHaveTextContent("2 / 4: Door panel stitching")

    await user.keyboard("{ArrowRight}")
    expect(screen.getByText(/3 \/ 4/)).toHaveTextContent(`3 / 4: ${FALLBACK}`)

    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}")
    expect(screen.getByText(/4 \/ 4/)).toHaveTextContent("4 / 4: Rear bench")
  })

  it("ao fechar, devolve o foco ao botão de origem mesmo após navegar", async () => {
    const user = userEvent.setup()
    render(<ProjectGallery layout={fullLayout} fallbackAlt={FALLBACK} />)

    const trigger = screen.getByRole("button", {
      name: "View image 2 of 4: Door panel stitching",
    })
    await user.click(trigger)
    await user.keyboard("{ArrowRight}")
    await user.keyboard("{Escape}")

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("com uma única imagem, o hero abre o lightbox sem setas", async () => {
    const user = userEvent.setup()
    render(
      <ProjectGallery
        layout={{ hero, entries: [], viewerImages: [hero] }}
        fallbackAlt={FALLBACK}
      />,
    )

    expect(screen.queryByRole("list")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "View image 1 of 1: Finished front seats" }),
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Next image" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Previous image" })).not.toBeInTheDocument()
  })
})
