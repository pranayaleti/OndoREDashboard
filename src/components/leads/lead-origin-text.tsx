import { describeLeadOrigin, type LeadOrigin } from "@/lib/lead-origin"

/** "Came from: YouTube comment ↗" — links to the thread when it's known. Renders nothing without an origin. */
export function LeadOriginText({ origin, className }: { origin: LeadOrigin | null | undefined; className?: string }) {
  const described = describeLeadOrigin(origin)
  if (!described) return null
  return (
    <span className={className}>
      Came from:{" "}
      {described.href ? (
        <a
          href={described.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {described.label}
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> (opens the thread in a new tab)</span>
        </a>
      ) : (
        described.label
      )}
    </span>
  )
}
