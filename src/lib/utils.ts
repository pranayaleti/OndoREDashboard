import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UUID_PATH_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True when a URL path segment is a UUID (e.g. `/properties/:id`). */
export function isUuidPathSegment(segment: string): boolean {
  return UUID_PATH_SEGMENT.test(segment)
}

/** True when the pathname includes a resource UUID — skip auto-generated crumbs. */
export function pathHasResourceId(pathname: string): boolean {
  return pathname.split("/").filter(Boolean).some(isUuidPathSegment)
}
