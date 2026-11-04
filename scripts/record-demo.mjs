/**
 * Records the two short walkthrough videos shown on /demo, from the real owner and tenant portals.
 *
 * Needs the LOCAL stack only (never point this at production): local Supabase + the Edge `api`
 * function (see ../docs or the Backend README), seeded with OndoREBackend/seed.ts, and the dashboard
 * dev server on :3001 with the API proxied same-origin (VITE_API_BASE_URL=http://localhost:3001/api).
 *
 *   DEMO_PASSWORD=<seed password> node scripts/record-demo.mjs
 *
 * Needs playwright (installed in ../OndoREui). Output: public/demo/{owner,tenant}-tour.webm + posters.
 * Signing in happens off-camera. Only pages with clean seed data are filmed.
 */
import { createRequire } from "node:module"
import { mkdirSync, renameSync, rmSync } from "node:fs"
const require = createRequire(new URL("../../OndoREui/package.json", import.meta.url))
const { chromium } = require("playwright")

const base = process.env.DEMO_URL || "http://localhost:3001"
const password = process.env.DEMO_PASSWORD
if (!password) throw new Error("Set DEMO_PASSWORD to the local seed password")
if (!/localhost|127\.0\.0\.1/.test(base)) throw new Error("Refusing to record against a non-local URL")

const out = new URL("../public/demo/", import.meta.url).pathname
const tmp = new URL("../.demo-rec/", import.meta.url).pathname
const size = { width: 1280, height: 720 }
mkdirSync(out, { recursive: true })

const flows = {
  owner: {
    email: "owner@ondorealestate.com",
    pick: /^Owners/,
    steps: [
      { path: "/owner", caption: "Your dashboard: ask anything about your property", ms: 4500 },
      { path: "/owner/portfolio", caption: "Portfolio: screening, leases, maintenance and tenants", ms: 4500, waitText: /^[1-9]\d* properties$/ },
      { path: "/owner/assistant", caption: "Assistant: answers from your own portfolio data", ms: 4500 },
      { path: "/owner/documents", caption: "Documents: store and share in one place", ms: 4500 },
    ],
  },
  tenant: {
    email: "tenant@ondorealestate.com",
    pick: /^Tenants/,
    steps: [
      { path: "/tenant/lease-details", caption: "Your lease, rent and next payment at a glance", ms: 4500 },
      { path: "/tenant/payments", caption: "Pay rent online and see your history", ms: 4500 },
      { path: "/tenant/maintenance", caption: "Report a problem with photos", ms: 1200, click: /New Request/ },
      { path: null, caption: "Report a problem with photos", ms: 3800 },
      { path: "/tenant/documents", caption: "Your lease and shared documents", ms: 4500 },
    ],
  },
}

const caption = (page, text) =>
  page.evaluate((t) => {
    let el = document.getElementById("__demo-caption")
    if (!el) {
      el = document.createElement("div")
      el.id = "__demo-caption"
      el.style.cssText =
        "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;background:rgba(13,15,20,.92);color:#fff;" +
        "border:1px solid rgba(249,115,22,.6);border-radius:999px;padding:10px 20px;font:600 16px system-ui,sans-serif;pointer-events:none"
      document.body.appendChild(el)
    }
    el.textContent = t
  }, text)

const hideHelp = (page) =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll("button, a, div")) {
      const r = el.getBoundingClientRect()
      if (getComputedStyle(el).position === "fixed" && el.textContent?.trim() === "Help" && r.bottom > innerHeight - 100) el.style.display = "none"
    }
  })

const goTo = (page, path) =>
  page.evaluate((p) => {
    history.pushState({}, "", p)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }, path)

const browser = await chromium.launch()
for (const [role, flow] of Object.entries(flows)) {
  // Off-camera: sign in, dismiss the first-run tour, keep the session.
  const login = await browser.newContext({ viewport: size })
  const lp = await login.newPage()
  await lp.goto(`${base}/login`)
  await lp.getByRole("button", { name: flow.pick }).click()
  await lp.fill('#email, input[type="email"]', flow.email)
  await lp.fill('input[type="password"]', password)
  await lp.getByRole("button", { name: /Continue/ }).click()
  await lp.waitForURL(new RegExp(`/${role}`))
  await lp.waitForTimeout(2500)
  await lp.getByText("Skip tour").click({ timeout: 3000 }).catch(() => {})
  const state = await login.storageState()
  await login.close()

  const ctx = await browser.newContext({ viewport: size, storageState: state, recordVideo: { dir: tmp, size } })
  const page = await ctx.newPage()
  await page.setContent('<body style="margin:0;background:#0d0f14"></body>')
  await page.goto(`${base}${flow.steps[0].path}`)
  await page.waitForTimeout(3000)
  await page.getByText("Skip tour").click({ timeout: 500 }).catch(() => {})
  let first = true
  let first_done = false
  for (const step of flow.steps) {
    await caption(page, step.caption)
    if (step.path && !first) await goTo(page, step.path)
    first = false
    await page.waitForTimeout(900)
    if (step.waitText) await page.getByText(step.waitText).first().waitFor({ timeout: 20000 })
    await hideHelp(page)
    if (step.click) await page.getByRole("button", { name: step.click }).click()
    if (role === "owner" && step.path === "/owner/portfolio") await page.mouse.wheel(0, 250)
    if (first_done === false) {
      await page.screenshot({ path: `${out}${role}-poster.png` })
      first_done = true
    }
    await page.waitForTimeout(step.ms)
  }
  // End on a dark frame instead of the white flash Chromium shows when the page closes.
  await page.setContent('<body style="margin:0;background:#0d0f14"></body>')
  await page.waitForTimeout(400)
  const video = page.video()
  await ctx.close()
  renameSync(await video.path(), `${out}${role}-tour.webm`)
}
await browser.close()
rmSync(tmp, { recursive: true, force: true })
console.log("recorded")
