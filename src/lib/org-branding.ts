/**
 * Org white-label branding helpers. The dashboard themes off the `--primary`
 * CSS variable (HSL tri:  "H S% L%"), so applying an org's brand color is a
 * matter of converting its hex to that triple and overriding the variable.
 */

export interface OrgBranding {
  primaryColor?: string; // hex, e.g. "#EA580C"
  logoUrl?: string;
}

/** Parse a #rgb / #rrggbb hex into {r,g,b} 0-255, or null if invalid. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Hex → CSS HSL triple "H S% L%" used by the design tokens. Null if invalid. */
export function hexToHslTriple(hex: string): string | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Relative luminance → pick a readable foreground (black/white) for a brand color. */
export function foregroundTripleFor(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return "0 0% 100%";
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.6 ? "0 0% 0%" : "0 0% 100%";
}

/** Apply an org brand color to the document by overriding --primary. Safe no-op on bad input. */
export function applyBrandColor(hex: string | undefined | null): void {
  if (typeof document === "undefined" || !hex) return;
  const triple = hexToHslTriple(hex);
  if (!triple) return;
  try {
    const root = document.documentElement;
    root.style.setProperty("--primary", triple);
    root.style.setProperty("--primary-foreground", foregroundTripleFor(hex));
  } catch {
    /* ignore — theming is a nicety, never break the app */
  }
}

/** Remove any applied brand override, reverting to the default design token. */
export function clearBrandColor(): void {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--primary-foreground");
  } catch {
    /* ignore */
  }
}
