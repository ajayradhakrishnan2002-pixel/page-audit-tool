"use client"

import { AuditLogo } from "./audit-logo"
import { PRODUCT_NAME } from "@/lib/brand"
import { useAuditTheme } from "./theme-provider"

interface AppTopNavProps {
  url?: string
  actions?: React.ReactNode
}

export function AppTopNav({ url, actions }: AppTopNavProps) {
  const { theme, toggleTheme } = useAuditTheme()

  return (
    <nav className="arcade-nav-pill arcade-nav-pill--app">
      <div className="arcade-nav-brand">
        <AuditLogo size={28} />
        <span>{PRODUCT_NAME}</span>
      </div>

      {url ? (
        <div className="arcade-url-chip">
          <span className="arcade-url-chip-dot" />
          <span className="arcade-url-chip-text">{url}</span>
        </div>
      ) : null}

      <div className="arcade-nav-actions">
        {actions}
        <button type="button" className="arcade-nav-theme" onClick={toggleTheme} aria-label="Toggle theme">
          ◐ {theme}
        </button>
      </div>
    </nav>
  )
}
