"use client"

import { Label, Link, ProgressBar, Stack, Text, Heading } from "@primer/react"
import {
  SearchIcon,
  AccessibilityIcon,
  ShareIcon,
  ZapIcon,
  CodeIcon,
  CheckCircleFillIcon,
  XCircleFillIcon,
  LightBulbIcon,
  ArrowUpRightIcon,
  FileIcon,
} from "@primer/octicons-react"
import type { AuditResult, AiRecommendation } from "@/lib/types"
import { ScoreRing } from "./score-ring"
import { CategoryCard, barColor } from "./category-card"

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  seo: <SearchIcon size={16} />,
  a11y: <AccessibilityIcon size={16} />,
  social: <ShareIcon size={16} />,
  perf: <ZapIcon size={16} />,
}

function Panel({
  title,
  icon,
  children,
  trailing,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <section
      style={{
        border: "var(--borderWidth-thin) solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-large, 12px)",
        background: "var(--bgColor-default)",
        padding: 24,
      }}
    >
      <Stack direction="vertical" gap="normal">
        <Stack direction="horizontal" gap="condensed" align="center" justify="space-between">
          <Stack direction="horizontal" gap="condensed" align="center">
            <span style={{ color: "var(--fgColor-muted)" }}>{icon}</span>
            <Heading as="h2" style={{ fontSize: 16, fontWeight: 600 }}>
              {title}
            </Heading>
          </Stack>
          {trailing}
        </Stack>
        {children}
      </Stack>
    </section>
  )
}

function impactVariant(impact: AiRecommendation["impact"]) {
  if (impact === "high") return "danger" as const
  if (impact === "medium") return "attention" as const
  return "secondary" as const
}

export function Results({ result }: { result: AuditResult }) {
  const { meta, ai } = result

  return (
    <Stack direction="vertical" gap="spacious">
      {/* Overview header */}
      <section
        style={{
          border: "var(--borderWidth-thin) solid var(--borderColor-default)",
          borderRadius: "var(--borderRadius-large, 12px)",
          background: "var(--bgColor-muted)",
          padding: 28,
        }}
      >
        <Stack
          direction="horizontal"
          gap="spacious"
          align="center"
          wrap="wrap"
          justify="space-between"
        >
          <Stack direction="horizontal" gap="spacious" align="center" wrap="wrap">
            <ScoreRing score={result.overallScore} grade={result.grade} label="Overall" />
            <Stack direction="vertical" gap="condensed" style={{ maxWidth: 360 }}>
              <Label variant="accent">Audit complete</Label>
              <Heading as="h1" style={{ fontSize: 22, fontWeight: 600, wordBreak: "break-word" }}>
                {meta.title || "Untitled page"}
              </Heading>
              <Link href={result.url} target="_blank" rel="noopener noreferrer">
                <Stack direction="horizontal" gap="none" align="center">
                  <Text size="small" style={{ color: "var(--fgColor-accent)" }}>
                    {result.url}
                  </Text>
                  <span style={{ color: "var(--fgColor-accent)", marginLeft: 4 }}>
                    <ArrowUpRightIcon size={14} />
                  </span>
                </Stack>
              </Link>
              <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                {meta.wordCount.toLocaleString()} words analyzed ·{" "}
                {new Date(result.fetchedAt).toLocaleString()}
              </Text>
            </Stack>
          </Stack>

          {/* Category breakdown mini bar chart */}
          <Stack direction="vertical" gap="condensed" style={{ flex: "1 1 280px", minWidth: 240 }}>
            <Text size="small" weight="semibold" style={{ color: "var(--fgColor-muted)" }}>
              Category breakdown
            </Text>
            {result.categories.map((cat) => (
              <Stack key={cat.id} direction="vertical" gap="none">
                <Stack direction="horizontal" justify="space-between" align="center">
                  <Text size="small">{cat.name}</Text>
                  <Text size="small" weight="semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {cat.score}
                  </Text>
                </Stack>
                <ProgressBar
                  progress={cat.score}
                  bg={barColor(cat.score)}
                  aria-label={`${cat.name} ${cat.score} out of 100`}
                />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </section>

      {/* Category detail cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {result.categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} icon={CATEGORY_ICONS[cat.id]} />
        ))}
      </div>

      {/* Technical fixes */}
      {result.technicalRecommendations.length > 0 ? (
        <Panel title="Technical Fixes" icon={<CheckCircleFillIcon size={16} />}>
          <Text size="small" style={{ color: "var(--fgColor-muted)", marginBottom: 8 }}>
            Rule-based findings from SEO, accessibility, social, performance, and schema checks.
          </Text>
          <RecommendationsList recommendations={result.technicalRecommendations} />
        </Panel>
      ) : null}

      {/* AI content analysis */}
      <Panel
        title="AI Content Insights"
        icon={<LightBulbIcon size={16} />}
        trailing={
          ai.estimated ? <Label variant="secondary">Heuristic estimate</Label> : <Label variant="success">AI-powered</Label>
        }
      >
        <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
          {ai.summary}
        </Text>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { label: "Readability", value: ai.readability },
            { label: "Clarity", value: ai.clarity },
            { label: "Tone", value: ai.tone },
          ].map((m) => (
            <Stack key={m.label} direction="vertical" gap="none">
              <Stack direction="horizontal" justify="space-between" align="center">
                <Text size="small" weight="medium">
                  {m.label}
                </Text>
                <Text size="small" weight="semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {m.value}
                </Text>
              </Stack>
              <ProgressBar progress={m.value} bg={barColor(m.value)} aria-label={`${m.label} ${m.value}`} />
            </Stack>
          ))}
        </div>

        {ai.recommendations.length > 0 ? (
          <Stack direction="vertical" gap="condensed">
            <Text size="small" weight="semibold" style={{ color: "var(--fgColor-muted)" }}>
              Content recommendations
            </Text>
            <RecommendationsList recommendations={ai.recommendations} />
          </Stack>
        ) : null}
      </Panel>

      {/* Structured data */}
      <Panel title="Structured Data (schema.org)" icon={<CodeIcon size={16} />}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {result.schema.map((item) => (
            <Stack
              key={item.type}
              direction="horizontal"
              gap="condensed"
              align="center"
              style={{
                border: "var(--borderWidth-thin) solid var(--borderColor-default)",
                borderRadius: "var(--borderRadius-medium, 8px)",
                padding: "10px 12px",
                background: item.found ? "var(--bgColor-success-muted, transparent)" : "transparent",
              }}
            >
              <span
                style={{
                  color: item.found
                    ? "var(--fgColor-success, #3fb950)"
                    : "var(--fgColor-muted)",
                }}
              >
                {item.found ? <CheckCircleFillIcon size={16} /> : <XCircleFillIcon size={16} />}
              </span>
              <Stack direction="vertical" gap="none">
                <Text size="small" weight="medium">
                  {item.type}
                </Text>
                <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                  {item.detail}
                </Text>
              </Stack>
            </Stack>
          ))}
        </div>
      </Panel>

      {/* Metadata preview */}
      <Panel title="Metadata & Social Preview" icon={<FileIcon size={16} />}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          <Stack direction="vertical" gap="condensed">
            <MetaRow label="Title" value={meta.title} />
            <MetaRow label="Description" value={meta.description} />
            <MetaRow label="Canonical" value={meta.canonical} />
            <MetaRow label="OG Title" value={meta.ogTitle} />
            <MetaRow label="OG Image" value={meta.ogImage} />
          </Stack>

          {/* Social card preview */}
          <div
            style={{
              border: "var(--borderWidth-thin) solid var(--borderColor-default)",
              borderRadius: "var(--borderRadius-medium, 8px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                aspectRatio: "1.91 / 1",
                background: "var(--bgColor-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {meta.ogImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meta.ogImage || "/placeholder.svg"}
                  alt="Open Graph preview"
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                  No og:image
                </Text>
              )}
            </div>
            <div style={{ padding: 12 }}>
              <Text size="small" style={{ color: "var(--fgColor-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 11 }}>
                {(() => {
                  try {
                    return new URL(result.url).hostname
                  } catch {
                    return result.url
                  }
                })()}
              </Text>
              <Text weight="semibold" style={{ display: "block" }}>
                {meta.ogTitle || meta.title || "Untitled"}
              </Text>
              <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                {meta.ogDescription || meta.description || "No description available."}
              </Text>
            </div>
          </div>
        </div>
      </Panel>
    </Stack>
  )
}

function RecommendationsList({ recommendations }: { recommendations: AiRecommendation[] }) {
  return (
    <Stack direction="vertical" gap="normal">
      {recommendations.map((rec, i) => (
        <Stack
          key={i}
          direction="horizontal"
          gap="normal"
          align="start"
          style={{
            paddingBottom: i < recommendations.length - 1 ? 16 : 0,
            borderBottom:
              i < recommendations.length - 1
                ? "var(--borderWidth-thin) solid var(--borderColor-muted)"
                : "none",
          }}
        >
          <span style={{ color: "var(--fgColor-accent)", marginTop: 2 }}>
            <ArrowUpRightIcon size={16} />
          </span>
          <Stack direction="vertical" gap="none" style={{ flex: 1 }}>
            <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
              <Text weight="semibold">{rec.title}</Text>
              <Label variant={impactVariant(rec.impact)}>{rec.impact} impact</Label>
            </Stack>
            <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
              {rec.description}
            </Text>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

function MetaRow({ label, value }: { label: string; value: string | null }) {
  return (
    <Stack direction="vertical" gap="none">
      <Stack direction="horizontal" gap="condensed" align="center">
        <span style={{ color: value ? "var(--fgColor-success, #3fb950)" : "var(--fgColor-danger, #f85149)" }}>
          {value ? <CheckCircleFillIcon size={12} /> : <XCircleFillIcon size={12} />}
        </span>
        <Text size="small" weight="semibold" style={{ color: "var(--fgColor-muted)" }}>
          {label}
        </Text>
      </Stack>
      <Text size="small" style={{ wordBreak: "break-word", color: "var(--fgColor-default)" }}>
        {value || "—"}
      </Text>
    </Stack>
  )
}
