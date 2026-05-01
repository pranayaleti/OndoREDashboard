#!/usr/bin/env npx tsx
/**
 * CI guard for bundle budgets that matter to the portal shell.
 *
 * The production audit identified `portal-sidebar` as a large, eagerly loaded
 * chunk because it owns the role navigation and many icon imports. Refactoring
 * the sidebar into lazy subtrees is risky without visual regression coverage, so
 * this guard makes the risk measurable: build output must keep the sidebar
 * chunk under the agreed budget.
 *
 * Run after `npm run build`, which writes Vite output to `dist/assets`.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");

interface Budget {
  chunkPrefix: string;
  maxRawKb: number;
  maxGzipKb: number;
}

const BUDGETS: Budget[] = [
  {
    chunkPrefix: "portal-sidebar-",
    // Current Phase 1/2 build: ~58 KB raw / ~15 KB gzip. Keep headroom for
    // i18n copy and route additions but fail fast if it drifts toward 100 KB.
    maxRawKb: 75,
    maxGzipKb: 20,
  },
];

function kb(bytes: number): number {
  return Math.round((bytes / 1024) * 100) / 100;
}

if (!existsSync(DIST_ASSETS)) {
  console.error("Bundle budget check failed: dist/assets does not exist. Run npm run build first.");
  process.exit(1);
}

let failed = false;
const files = readdirSync(DIST_ASSETS);

for (const budget of BUDGETS) {
  const matches = files.filter((file) => file.startsWith(budget.chunkPrefix) && file.endsWith(".js"));
  if (matches.length === 0) {
    console.error(`Bundle budget check failed: no chunk matching ${budget.chunkPrefix}*.js`);
    failed = true;
    continue;
  }

  for (const match of matches) {
    const contents = readFileSync(join(DIST_ASSETS, match));
    const rawKb = kb(contents.byteLength);
    const gzipKb = kb(gzipSync(contents).byteLength);
    console.log(
      `${match}: raw=${rawKb} KB (max ${budget.maxRawKb}), gzip=${gzipKb} KB (max ${budget.maxGzipKb})`
    );

    if (rawKb > budget.maxRawKb || gzipKb > budget.maxGzipKb) {
      console.error(`Bundle budget exceeded for ${match}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("Bundle budgets OK.");
