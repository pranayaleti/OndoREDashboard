/**
 * Get the logo path with proper base URL handling for Vite
 */
export function getLogoPath(): string {
  const baseUrl = import.meta.env?.BASE_URL || '/'
  return `${baseUrl}favicon.svg`
}
