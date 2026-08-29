import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

/** Safe wrapper — next-themes' context is undefined until the provider commits. */
export function useTheme() {
  const ctx = useNextTheme()
  return {
    theme: ctx?.theme,
    resolvedTheme: ctx?.resolvedTheme,
    setTheme: ctx?.setTheme ?? ((_value: string) => undefined),
    themes: ctx?.themes ?? ["light", "dark", "system"],
    systemTheme: ctx?.systemTheme,
  }
}
