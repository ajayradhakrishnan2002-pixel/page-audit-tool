"use client"

import { useMemo, useState } from "react"
import type { AuditResult, AiRecommendation, CategoryResult } from "@/lib/types"
import {
  NAV_SECTIONS,
  accentColor,
  impactColor,
  scoreColor,
  severityToStatus,
  statusColor,
  statusGlyph,
  type SectionId,
} from "@/lib/audit-design"
import { useAuditTheme } from "./theme-provider"
import { AppTopNav } from "./app-top-nav"

interface ResultsDashboardProps {
  result: AuditResult
  onNewAudit: () => void
}

function ScoreBar({ value, color, size = "default" }: { value: number; color: string; size?: "default" | "sm" | "lg" }) {
  return (
    <span className={`audit-bar-track${size === "sm" ? " sm" : size === "lg" ? " lg" : ""}`}>
      <span className="audit-bar-fill" style={{ width: `${value}%`, background: color }} />
    </span>
  )
}

function StatusBadge({ status, theme }: { status: "pass" | "warn" | "fail"; theme: "light" | "dark" }) {
  const col = statusColor(status, theme)
  return (
    <span className="audit-badge" style={{ background: `${col}22`, color: col }}>
      {statusGlyph(status)}
    </span>
  )
}

function ImpactChip({ impact, theme }: { impact: AiRecommendation["impact"]; theme: "light" | "dark" }) {
  const col = impactColor(impact, theme)
  return (
    <span className="audit-chip" style={{ color: col, background: `${col}1f`, border: `1px solid ${col}40` }}>
      {impact} impact
    </span>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="arcade-section-header">
      <h2 className="arcade-section-title">{title}</h2>
      <p className="arcade-section-desc">{description}</p>
    </div>
  )
}

function SidebarGauge({ score, grade, theme }: { score: number; grade: string; theme: "light" | "dark" }) {
  const radius = 40
  const circ = 2 * Math.PI * radius
  const color = scoreColor(score, theme)
  const offset = circ * (1 - score / 100)

  return (
    <div style={{ position: "relative", width: 92, height: 92, flex: "none" }}>
      <svg width={92} height={92} viewBox="0 0 92 92" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={46} cy={46} r={radius} fill="none" stroke="var(--audit-soft)" strokeWidth={9} />
        <circle
          cx={46}
          cy={46}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{score}</div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color,
            marginTop: 2,
          }}
        >
          GRADE {grade}
        </div>
      </div>
    </div>
  )
}

function OverviewSection({
  result,
  theme,
  onNavigate,
}: {
  result: AuditResult
  theme: "light" | "dark"
  onNavigate: (id: SectionId) => void
}) {
  const accent = accentColor(theme)
  const allRecs = [...result.technicalRecommendations, ...result.ai.recommendations]
  const topRecs = allRecs.slice(0, 3)

  return (
    <div style={{ animation: "audit-fadein 0.35s ease" }}>
      <SectionHeader
        title="Overview"
        description="Summary across all audited categories for this page."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {result.categories.map((cat) => {
          const color = scoreColor(cat.score, theme)
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigate(cat.id as SectionId)}
              className="arcade-glass-card"
              style={{
                padding: "18px 20px",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--audit-fg3)" }}>
                  {cat.id === "seo" ? "⌕" : cat.id === "a11y" ? "◍" : cat.id === "social" ? "⤴" : "↯"}
                </span>
                <span style={{ fontSize: 13, color: "var(--audit-fg2)" }}>{cat.name}</span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color, marginBottom: 12 }}>
                {cat.score}
              </div>
              <ScoreBar value={cat.score} color={color} />
            </button>
          )
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
        <div className="arcade-glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>AI Content Review</span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: result.ai.estimated ? "var(--audit-fg3)" : "#1a7f37",
                background: result.ai.estimated ? "var(--audit-soft)" : "#1a7f3714",
                padding: "3px 9px",
                borderRadius: 99,
              }}
            >
              {result.ai.estimated ? "Estimate" : "AI"}
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--audit-fg2)", margin: "0 0 18px" }}>
            {result.ai.summary}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { label: "Readability", value: result.ai.readability },
              { label: "Clarity", value: result.ai.clarity },
              { label: "Tone", value: result.ai.tone },
            ].map((m) => (
              <div key={m.label} style={{ background: "var(--audit-soft)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--audit-fg2)" }}>{m.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{m.value}</span>
                </div>
                <ScoreBar value={m.value} color={accent} size="sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="arcade-glass-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <span style={{ fontSize: 16, color: "var(--audit-accent)" }}>◎</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Top fixes</span>
          </div>
          {topRecs.map((rec, i) => {
            const col = impactColor(rec.impact, theme)
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "11px 0",
                  borderTop: i > 0 ? "1px solid var(--audit-border-soft)" : "none",
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 99,
                    background: col,
                    flex: "none",
                    marginTop: 6,
                  }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{rec.title}</div>
                  <div style={{ fontSize: 12, color: "var(--audit-fg3)", textTransform: "capitalize" }}>
                    {rec.impact} impact
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CategorySection({ category, theme }: { category: CategoryResult; theme: "light" | "dark" }) {
  const passCount = category.checks.filter((c) => c.severity === "pass").length
  const color = scoreColor(category.score, theme)

  return (
    <div style={{ animation: "audit-fadein 0.35s ease" }}>
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 6px" }}>
            {category.name}
          </h2>
          <p style={{ fontSize: 15, color: "var(--audit-fg2)", margin: 0, maxWidth: 460 }}>
            {category.description}
          </p>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", color }}>
            {category.score}
          </div>
          <div style={{ fontSize: 13, color: "var(--audit-fg3)", marginTop: 4 }}>
            {passCount}/{category.checks.length} checks passed
          </div>
        </div>
      </div>

      <div className="arcade-glass-card" style={{ padding: "8px 28px" }}>
        {category.checks.map((check, i) => {
          const status = severityToStatus(check.severity)
          return (
            <div
              key={check.id}
              style={{
                display: "flex",
                gap: 14,
                padding: "18px 0",
                borderTop: i > 0 ? "1px solid var(--audit-border-soft)" : "none",
              }}
            >
              <StatusBadge status={status} theme={theme} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{check.label}</div>
                <div style={{ fontSize: 13, color: "var(--audit-fg3)", marginTop: 3 }}>{check.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AiSection({ result, theme }: { result: AuditResult; theme: "light" | "dark" }) {
  const accent = accentColor(theme)
  return (
    <div style={{ animation: "audit-fadein 0.35s ease" }}>
      <SectionHeader title="AI Content" description="Model-graded review of the page content." />
      <div className="arcade-glass-card" style={{ padding: 28 }}>
        <p style={{ fontSize: 16, lineHeight: 1.75, margin: "0 0 26px" }}>{result.ai.summary}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20 }}>
          {[
            { label: "Readability", value: result.ai.readability },
            { label: "Clarity", value: result.ai.clarity },
            { label: "Tone", value: result.ai.tone },
          ].map((m) => (
            <div key={m.label} style={{ background: "var(--audit-soft)", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: "var(--audit-fg2)" }}>{m.label}</span>
                <span style={{ fontSize: 20, fontWeight: 800 }}>{m.value}</span>
              </div>
              <ScoreBar value={m.value} color={accent} size="lg" />
            </div>
          ))}
        </div>
        {result.ai.recommendations.length > 0 ? (
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--audit-border-soft)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Content recommendations</div>
            <RecommendationsList recommendations={result.ai.recommendations} theme={theme} numbered={false} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function RecommendationsList({
  recommendations,
  theme,
  numbered = true,
}: {
  recommendations: AiRecommendation[]
  theme: "light" | "dark"
  numbered?: boolean
}) {
  return (
    <>
      {recommendations.map((rec, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 16,
            padding: "20px 0",
            borderTop: i > 0 ? "1px solid var(--audit-border-soft)" : "none",
          }}
        >
          {numbered ? (
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--audit-accent-tint)",
                color: "var(--audit-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                flex: "none",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          ) : null}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{rec.title}</span>
              <ImpactChip impact={rec.impact} theme={theme} />
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--audit-fg2)" }}>{rec.description}</div>
          </div>
        </div>
      ))}
    </>
  )
}

function RecsSection({ result, theme }: { result: AuditResult; theme: "light" | "dark" }) {
  const allRecs = useMemo(() => {
    const impactOrder = { high: 0, medium: 1, low: 2 }
    return [...result.technicalRecommendations, ...result.ai.recommendations].sort(
      (a, b) => impactOrder[a.impact] - impactOrder[b.impact],
    )
  }, [result])

  return (
    <div style={{ animation: "audit-fadein 0.35s ease" }}>
      <SectionHeader title="Recommendations" description="Prioritized fixes ranked by impact." />
      <div className="arcade-glass-card" style={{ padding: "8px 28px" }}>
        <RecommendationsList recommendations={allRecs} theme={theme} />
      </div>
    </div>
  )
}

function SchemaSection({ result, theme }: { result: AuditResult; theme: "light" | "dark" }) {
  return (
    <div style={{ animation: "audit-fadein 0.35s ease" }}>
      <SectionHeader title="Structured Data" description="Detected schema.org structured data types." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {result.schema.map((item) => {
          const status = item.found ? "pass" : "fail"
          return (
            <div
              key={item.type}
              className="arcade-glass-card"
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 18, borderRadius: 14 }}
            >
              <StatusBadge status={status} theme={theme} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.type}</div>
                <div style={{ fontSize: 13, color: "var(--audit-fg3)", marginTop: 2 }}>{item.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MetaSection({ result }: { result: AuditResult }) {
  const { meta } = result
  const { theme } = useAuditTheme()
  const hostname = (() => {
    try {
      return new URL(result.url).hostname
    } catch {
      return result.url
    }
  })()

  const rows = [
    { label: "Title", value: meta.title },
    { label: "Description", value: meta.description },
    { label: "Canonical", value: meta.canonical },
    { label: "OG Title", value: meta.ogTitle },
    { label: "OG Image", value: meta.ogImage },
  ]

  return (
    <div style={{ animation: "audit-fadein 0.35s ease" }}>
      <SectionHeader title="Metadata & Social" description="Raw metadata and the social sharing preview." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div className="arcade-glass-card" style={{ padding: "8px 24px" }}>
          {rows.map((row, i) => {
            const status = row.value ? "pass" : "fail"
            return (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "15px 0",
                  borderTop: i > 0 ? "1px solid var(--audit-border-soft)" : "none",
                }}
              >
                <StatusBadge status={status} theme={theme} />
                <span style={{ fontSize: 14, fontWeight: 600, width: 100, flex: "none" }}>{row.label}</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: "var(--audit-fg3)",
                    wordBreak: "break-word",
                  }}
                >
                  {row.value || "—"}
                </span>
              </div>
            )
          })}
        </div>

        <div className="arcade-glass-card" style={{ alignSelf: "start", overflow: "hidden" }}>
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--audit-fg3)",
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              backgroundImage:
                "repeating-linear-gradient(45deg, var(--audit-soft), var(--audit-soft) 9px, var(--audit-panel) 9px, var(--audit-panel) 10px)",
              overflow: "hidden",
            }}
          >
            {meta.ogImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.ogImage} alt="Open Graph preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "No og:image"
            )}
          </div>
          <div style={{ padding: "16px 18px", borderTop: "1px solid var(--audit-border)" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.06em", color: "var(--audit-fg3)", textTransform: "uppercase" }}>
              {hostname}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 5 }}>
              {meta.ogTitle || meta.title || "Untitled"}
            </div>
            <div style={{ fontSize: 14, color: "var(--audit-fg3)", marginTop: 3 }}>
              {meta.ogDescription || meta.description || "No description available."}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ResultsDashboard({ result, onNewAudit }: ResultsDashboardProps) {
  const { theme } = useAuditTheme()
  const accent = accentColor(theme)
  const [section, setSection] = useState<SectionId>("overview")

  const categoryById = useMemo(() => {
    const map: Record<string, CategoryResult> = {}
    result.categories.forEach((c) => {
      map[c.id] = c
    })
    return map
  }, [result.categories])

  const activeCategory = ["seo", "a11y", "social", "perf"].includes(section)
    ? categoryById[section]
    : null

  return (
    <div className="arcade-app arcade-app--results">
      <div className="arcade-landing-bg" aria-hidden />
      <div className="arcade-app-body">
        <AppTopNav
          url={result.url}
          actions={
            <button type="button" className="arcade-nav-action" onClick={onNewAudit}>
              ↻ New audit
            </button>
          }
        />

        <div className="arcade-results-layout">
        <aside className="arcade-sidebar">
          <div className="arcade-glass-card arcade-score-card">
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <SidebarGauge score={result.overallScore} grade={result.grade} theme={theme} />
              <div style={{ minWidth: 0 }}>
                <div className="arcade-badge">Audit complete</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {result.meta.title || "Untitled page"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--audit-fg3)",
                    marginTop: 3,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {result.meta.wordCount.toLocaleString()} words ·{" "}
                  {new Date(result.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>

          <p className="arcade-nav-section-label">Report sections</p>

          <nav className="arcade-section-nav">
            {NAV_SECTIONS.map((nav) => {
              const active = section === nav.id
              const catScore = nav.hasScore ? categoryById[nav.id]?.score : undefined
              const scoreCol = catScore != null ? scoreColor(catScore, theme) : accent

              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setSection(nav.id)}
                  className={`arcade-section-nav-item${active ? " active" : ""}`}
                >
                  <span className="arcade-section-nav-icon">{nav.glyph}</span>
                  <span className="arcade-section-nav-label">{nav.name}</span>
                  {catScore != null ? (
                    <span className="arcade-section-nav-score" style={{ color: scoreCol, background: `${scoreCol}1c` }}>
                      {catScore}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="arcade-main-content">
          {section === "overview" ? (
            <OverviewSection result={result} theme={theme} onNavigate={setSection} />
          ) : null}
          {activeCategory ? <CategorySection category={activeCategory} theme={theme} /> : null}
          {section === "ai" ? <AiSection result={result} theme={theme} /> : null}
          {section === "recs" ? <RecsSection result={result} theme={theme} /> : null}
          {section === "schema" ? <SchemaSection result={result} theme={theme} /> : null}
          {section === "meta" ? <MetaSection result={result} /> : null}
        </main>
        </div>
      </div>
    </div>
  )
}
