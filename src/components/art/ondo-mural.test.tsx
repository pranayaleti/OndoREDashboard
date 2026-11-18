import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MuralVignette, OndoMural, TRAIL, pointAlong } from "./ondo-mural"

describe("pointAlong", () => {
  it("starts at the trailhead and ends at the summit", () => {
    expect(pointAlong(TRAIL, 0)).toEqual(TRAIL[0])
    expect(pointAlong(TRAIL, 1)).toEqual(TRAIL[TRAIL.length - 1])
  })

  it("clamps out-of-range progress", () => {
    expect(pointAlong(TRAIL, -2)).toEqual(TRAIL[0])
    expect(pointAlong(TRAIL, 7)).toEqual(TRAIL[TRAIL.length - 1])
  })

  it("walks by length, not by vertex count", () => {
    const line = [
      [0, 0],
      [10, 0],
      [10, 30],
    ] as const
    expect(pointAlong(line, 0.25)).toEqual([10, 0])
    expect(pointAlong(line, 0.5)).toEqual([10, 10])
  })
})

describe("OndoMural", () => {
  it("is decorative and puts the flag where the progress says", () => {
    const { container } = render(<OndoMural scene="trail" progress={1} />)
    const svg = screen.getByTestId("mural-trail")
    expect(svg).toHaveAttribute("aria-hidden", "true")
    const pennant = screen.getByTestId("mural-flag").querySelector("path")
    const [sx, sy] = TRAIL[TRAIL.length - 1]
    expect(pennant?.getAttribute("d")).toBe(`M${sx} ${sy - 36} L${sx + 24} ${sy - 29} L${sx} ${sy - 21} Z`)
    // Filter ids are unique per instance so two murals on a page don't collide.
    expect(container.querySelectorAll("filter[id^='mural-paint-']")).toHaveLength(1)
  })

  it("renders the neighbors scene and the vignette", () => {
    render(
      <>
        <OndoMural scene="neighbors" />
        <MuralVignette />
      </>,
    )
    expect(screen.getByTestId("mural-neighbors")).toBeInTheDocument()
    expect(screen.getByTestId("mural-vignette")).toHaveAttribute("aria-hidden", "true")
  })
})
