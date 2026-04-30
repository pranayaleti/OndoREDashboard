#!/usr/bin/env npx tsx
/**
 * CI guard: ensures every locale namespace shipped under public/locales/en/
 * is mirrored across all 8 locales with the same key paths.
 *
 * Walks each en/<namespace>.json, flattens its keys, and reports any keys
 * missing from the equivalent locale file. Per AGENTS.md, every key in
 * en/*.json must exist in all 7 other locales in the same change.
 *
 * Usage: npx tsx scripts/check-locale-parity.ts
 * Exit 0 = all in sync, Exit 1 = missing keys found.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, "../public/locales");

function flattenKeys(obj: unknown, prefix = ""): Set<string> {
  const keys = new Set<string>();
  if (typeof obj !== "object" || obj === null) return keys;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const subKey of flattenKeys(value, fullKey)) {
        keys.add(subKey);
      }
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

const enDir = resolve(LOCALES_DIR, "en");
if (!existsSync(enDir)) {
  console.error("Missing reference locale dir:", enDir);
  process.exit(1);
}

const namespaces = readdirSync(enDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

if (namespaces.length === 0) {
  console.error("No JSON namespaces under en/. Nothing to check.");
  process.exit(1);
}

const locales = readdirSync(LOCALES_DIR).filter((d) => {
  try {
    return readdirSync(resolve(LOCALES_DIR, d)).some((f) => f.endsWith(".json"));
  } catch {
    return false;
  }
});

console.log(`Namespaces: ${namespaces.join(", ")}`);
console.log(`Locales: ${locales.join(", ")}`);

let hasGaps = false;

for (const namespace of namespaces) {
  const enPath = resolve(LOCALES_DIR, "en", `${namespace}.json`);
  const enKeys = flattenKeys(JSON.parse(readFileSync(enPath, "utf-8")));
  console.log(`\n[${namespace}] reference: en (${enKeys.size} keys)`);

  for (const locale of locales) {
    if (locale === "en") continue;
    const filePath = resolve(LOCALES_DIR, locale, `${namespace}.json`);
    if (!existsSync(filePath)) {
      console.error(`  ${locale}/${namespace}.json: MISSING entire file`);
      hasGaps = true;
      continue;
    }
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error(`  ${locale}/${namespace}.json: invalid JSON (${(err as Error).message})`);
      hasGaps = true;
      continue;
    }
    const localeKeys = flattenKeys(data);

    const missingFromLocale = [...enKeys].filter((k) => !localeKeys.has(k));
    const extraInLocale = [...localeKeys].filter((k) => !enKeys.has(k));

    if (missingFromLocale.length > 0) {
      console.error(
        `  ${locale}/${namespace}.json: MISSING ${missingFromLocale.length} keys from en:`
      );
      for (const key of missingFromLocale.slice(0, 20)) {
        console.error(`    - ${key}`);
      }
      if (missingFromLocale.length > 20) {
        console.error(`    ... and ${missingFromLocale.length - 20} more`);
      }
      hasGaps = true;
    }

    if (extraInLocale.length > 0) {
      console.warn(
        `  ${locale}/${namespace}.json: has ${extraInLocale.length} EXTRA keys not in en (stale?):`
      );
      for (const key of extraInLocale.slice(0, 10)) {
        console.warn(`    + ${key}`);
      }
      if (extraInLocale.length > 10) {
        console.warn(`    ... and ${extraInLocale.length - 10} more`);
      }
    }

    if (missingFromLocale.length === 0 && extraInLocale.length === 0) {
      console.log(`  ${locale}/${namespace}.json: OK (${localeKeys.size} keys)`);
    }
  }
}

if (hasGaps) {
  console.error("\nLocale parity check FAILED — missing keys detected.");
  process.exit(1);
} else {
  console.log("\nAll locales are in sync with en across every namespace.");
  process.exit(0);
}
