"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { AuditTheme } from "@/lib/audit-design"

interface ThemeContextValue {
  theme: AuditTheme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
})

export function AuditThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AuditTheme>("dark")

  useEffect(() => {
    document.documentElement.dataset.auditTheme = theme
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useAuditTheme() {
  return useContext(ThemeContext)
}
