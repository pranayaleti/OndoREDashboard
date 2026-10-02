/**
 * GitHub Pages only knows files. Without one at a path it serves 404.html, so every deep link
 * (/login, /referrals, /owner, ...) rendered fine but answered with HTTP 404, and link checkers
 * and search engines reported them as broken. Copy the app shell to <route>/index.html for the
 * routes people and other sites link to, so those answer 200. Deeper portal paths still fall
 * back to 404.html, which renders the same app.
 *
 * Run after `vite build`. Keep ROUTES in step with the top-level routes in src/App.tsx.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const DIST = process.env.DIST_DIR || "dist"

export const ROUTES = [
  "about", "pricing", "contact", "faq", "free-trial", "features", "product",
  "login", "register", "forgot-password", "reset-password", "verify", "privacy", "terms", "referrals",
  "super-admin", "admin", "dashboard", "owner", "tenant", "maintenance",
]

const shell = join(DIST, "index.html")
if (!existsSync(shell)) {
  console.error(`write-route-pages: ${shell} not found, run vite build first`)
  process.exit(1)
}
for (const route of ROUTES) {
  const dir = join(DIST, route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(shell, join(dir, "index.html"))
}
console.log(`write-route-pages: wrote ${ROUTES.length} route pages`)
