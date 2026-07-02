"use client"

import { useEffect, useState } from "react"

const STAGES = [
  "Fetching the page with Firecrawl",
  "Parsing HTML and metadata",
  "Running SEO and accessibility checks",
  "Detecting structured data (schema.org)",
  "Analyzing content with AI",
  "Scoring and compiling the report",
]

export function LoadingStages() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a < STAGES.length - 1 ? a + 1 : a))
    }, 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="audit-card"
      style={{
        padding: 28,
        maxWidth: 580,
        margin: "32px auto 0",
        animation: "audit-fadein 0.35s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div className="audit-spinner" />
        <span style={{ fontWeight: 600, fontSize: 15 }}>Auditing your page…</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {STAGES.map((stage, i) => {
          const done = i < active
          const current = i === active
          return (
            <div
              key={stage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: done || current ? 1 : 0.45,
                transition: "opacity 0.4s ease",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  background: done
                    ? "#1a7f3722"
                    : current
                      ? "var(--audit-accent-tint)"
                      : "var(--audit-soft)",
                  color: done ? "#1a7f37" : current ? "var(--audit-accent)" : "var(--audit-fg3)",
                }}
              >
                {done ? "✓" : current ? "…" : ""}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: current ? "var(--audit-fg)" : "var(--audit-fg2)",
                  fontWeight: current ? 600 : 400,
                }}
              >
                {stage}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
