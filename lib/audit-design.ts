export type AuditTheme = "light" | "dark"

export type SectionId =
  | "overview"
  | "seo"
  | "a11y"
  | "social"
  | "perf"
  | "ai"
  | "recs"
  | "schema"
  | "meta"

export type StatusKind = "pass" | "warn" | "fail"

export function accentColor(_theme: AuditTheme): string {
  return "#60a5fa"
}

export function statusColor(status: StatusKind, theme: AuditTheme): string {
  const dark = { pass: "#3fb950", warn: "#d29922", fail: "#f85149" }
  const light = { pass: "#1a7f37", warn: "#9a6700", fail: "#cf222e" }
  return (theme === "light" ? light : dark)[status]
}

export function severityToStatus(severity: "pass" | "warning" | "error"): StatusKind {
  if (severity === "pass") return "pass"
  if (severity === "warning") return "warn"
  return "fail"
}

export function impactColor(impact: "high" | "medium" | "low", theme: AuditTheme): string {
  const dark = { high: "#f85149", medium: "#d29922", low: "#8b909a" }
  const light = { high: "#cf222e", medium: "#9a6700", low: "#8b909a" }
  return (theme === "light" ? light : dark)[impact]
}

export function scoreColor(score: number, theme: AuditTheme): string {
  if (score >= 90) return statusColor("pass", theme)
  if (score >= 70) return theme === "light" ? "#3f9142" : "#56d364"
  if (score >= 50) return statusColor("warn", theme)
  return statusColor("fail", theme)
}

export function statusGlyph(status: StatusKind): string {
  if (status === "pass") return "✓"
  if (status === "warn") return "!"
  return "✕"
}

export const CATEGORY_GLYPHS: Record<string, string> = {
  seo: "⌕",
  a11y: "◍",
  social: "⤴",
  perf: "↯",
}

export const FEATURES = [
  { glyph: "⌕", name: "SEO & metadata" },
  { glyph: "◍", name: "Accessibility" },
  { glyph: "⤴", name: "Social sharing" },
  { glyph: "↯", name: "Performance" },
  { glyph: "◇", name: "Schema.org" },
  { glyph: "✦", name: "AI content review" },
]

export const NAV_SECTIONS: { id: SectionId; name: string; glyph: string; hasScore?: boolean }[] = [
  { id: "overview", name: "Overview", glyph: "▦" },
  { id: "seo", name: "SEO & Metadata", glyph: "⌕", hasScore: true },
  { id: "a11y", name: "Accessibility", glyph: "◍", hasScore: true },
  { id: "social", name: "Social Sharing", glyph: "⤴", hasScore: true },
  { id: "perf", name: "Performance", glyph: "↯", hasScore: true },
  { id: "ai", name: "AI Content", glyph: "✦" },
  { id: "recs", name: "Recommendations", glyph: "◎" },
  { id: "schema", name: "Structured Data", glyph: "</>" },
  { id: "meta", name: "Metadata & Social", glyph: "▤" },
]
