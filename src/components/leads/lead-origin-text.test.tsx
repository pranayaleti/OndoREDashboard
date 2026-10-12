import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { LeadOriginText } from "./lead-origin-text"

describe("LeadOriginText", () => {
  it("links a comment lead to its thread in a new tab", () => {
    render(
      <LeadOriginText
        origin={{
          source: "youtube",
          medium: "Comments",
          campaign: "Comments",
          content: "dQw4w9WgXcQ",
          term: null,
          landingPath: "/property-management/",
          fromComment: true,
        }}
      />,
    )
    const link = screen.getByRole("link", { name: /YouTube comment/ })
    expect(link.getAttribute("href")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
    expect(screen.getByText(/Came from:/)).toBeTruthy()
  })

  it("shows plain text for a non-comment campaign", () => {
    render(
      <LeadOriginText
        origin={{
          source: "instagram",
          medium: "social",
          campaign: "bio",
          content: null,
          term: null,
          landingPath: "/links/",
          fromComment: false,
        }}
      />,
    )
    expect(screen.getByText("Came from: Instagram · social · bio")).toBeTruthy()
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("renders nothing without an origin", () => {
    const { container } = render(<LeadOriginText origin={null} />)
    expect(container.textContent).toBe("")
  })
})
