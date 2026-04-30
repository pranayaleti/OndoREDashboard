#!/usr/bin/env npx tsx
/**
 * CI guard: ensures all 8 locale translation files have the same key paths.
 * Walks JSON recursively and reports any keys missing from non-English locales.
 *
 * Usage: npx tsx scripts/check-locale-parity.ts
 * Exit 0 = all in sync, Exit 1 = missing keys found.
 */

import { readFileSync, readdirSync } from "fs";
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

const locales = readdirSync(LOCALES_DIR).filter((d) => {
  try {
    return readdirSync(resolve(LOCALES_DIR, d)).includes("common.json");
  } catch {
    return false;
  }
});

if (locales.length === 0) {
  console.error("No locale directories found in", LOCALES_DIR);
  process.exit(1);
}

// Use 'en' as the reference
const enPath = resolve(LOCALES_DIR, "en/common.json");
const enData = JSON.parse(readFileSync(enPath, "utf-8"));
const enKeys = flattenKeys(enData);

console.log(`Reference: en (${enKeys.size} keys)`);

let hasGaps = false;

for (const locale of locales) {
  if (locale === "en") continue;
  const filePath = resolve(LOCALES_DIR, locale, "common.json");
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  const localeKeys = flattenKeys(data);

  const missingFromLocale = [...enKeys].filter((k) => !localeKeys.has(k));
  const extraInLocale = [...localeKeys].filter((k) => !enKeys.has(k));

  if (missingFromLocale.length > 0) {
    console.error(`\n${locale}: MISSING ${missingFromLocale.length} keys from en:`);
    for (const key of missingFromLocale.slice(0, 20)) {
      console.error(`  - ${key}`);
    }
    if (missingFromLocale.length > 20) {
      console.error(`  ... and ${missingFromLocale.length - 20} more`);
    }
    hasGaps = true;
  }

  if (extraInLocale.length > 0) {
    console.warn(`\n${locale}: has ${extraInLocale.length} EXTRA keys not in en (may be stale):`);
    for (const key of extraInLocale.slice(0, 10)) {
      console.warn(`  + ${key}`);
    }
    if (extraInLocale.length > 10) {
      console.warn(`  ... and ${extraInLocale.length - 10} more`);
    }
  }

  if (missingFromLocale.length === 0 && extraInLocale.length === 0) {
    console.log(`${locale}: OK (${localeKeys.size} keys)`);
  }
}

if (hasGaps) {
  console.error("\nLocale parity check FAILED — missing keys detected.");
  process.exit(1);
} else {
  console.log("\nAll locales are in sync with en.");
  process.exit(0);
}
