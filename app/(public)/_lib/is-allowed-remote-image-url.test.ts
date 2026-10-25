import { describe, expect, it } from "vitest"

import { isAllowedRemoteImageUrl } from "./is-allowed-remote-image-url"

describe("isAllowedRemoteImageUrl", () => {
  it("aceita https em res.cloudinary.com", () => {
    expect(isAllowedRemoteImageUrl("https://res.cloudinary.com/demo/image/upload/v1/a.jpg")).toBe(
      true,
    )
  })

  it("rejeita http em res.cloudinary.com", () => {
    expect(isAllowedRemoteImageUrl("http://res.cloudinary.com/demo/a.jpg")).toBe(false)
  })

  it("rejeita outro host", () => {
    expect(isAllowedRemoteImageUrl("https://cdn.example.com/a.jpg")).toBe(false)
  })

  it("rejeita host parecido (lookalike)", () => {
    expect(isAllowedRemoteImageUrl("https://res.cloudinary.com.evil.com/a.jpg")).toBe(false)
  })

  it("rejeita subdomínio não listado", () => {
    expect(isAllowedRemoteImageUrl("https://evil.res.cloudinary.com/a.jpg")).toBe(false)
  })

  it.each(["", "not a url", "/relative/path.jpg"])("rejeita string inválida (%o)", (value) => {
    expect(isAllowedRemoteImageUrl(value)).toBe(false)
  })
})
