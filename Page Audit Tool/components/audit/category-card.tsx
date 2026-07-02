"use client"

import { Label, ProgressBar, Stack, Text } from "@primer/react"
import {
  CheckCircleFillIcon,
  AlertFillIcon,
  XCircleFillIcon,
} from "@primer/octicons-react"
import type { CategoryResult, Severity } from "@/lib/types"
import type { ReactNode } from "react"

function barColor(score: number): string {
  if (score >= 90) return "success.emphasis"
  if (score >= 70) return "attention.emphasis"
  if (score >= 50) return "severe.emphasis"
  return "danger.emphasis"
}

function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === "pass")
    return (
      <span style={{ color: "var(--fgColor-success, #3fb950)" }}>
        <CheckCircleFillIcon size={14} />
      </span>
    )
  if (severity === "warning")
    return (
      <span style={{ color: "var(--fgColor-attention, #d29922)" }}>
        <AlertFillIcon size={14} />
      </span>
    )
  return (
    <span style={{ color: "var(--fgColor-danger, #f85149)" }}>
      <XCircleFillIcon size={14} />
    </span>
  )
}

export function CategoryCard({
  category,
  icon,
}: {
  category: CategoryResult
  icon: ReactNode
}) {
  const passCount = category.checks.filter((c) => c.severity === "pass").length

  return (
    <div
      style={{
        border: "var(--borderWidth-thin) solid var(--borderColor-default)",
        borderRadius: "var(--borderRadius-large, 12px)",
        background: "var(--bgColor-default)",
        padding: 20,
        height: "100%",
      }}
    >
      <Stack direction="vertical" gap="normal">
        <Stack direction="horizontal" gap="condensed" align="center" justify="space-between">
          <Stack direction="horizontal" gap="condensed" align="center">
            <span style={{ color: "var(--fgColor-muted)" }}>{icon}</span>
            <Text weight="semibold">{category.name}</Text>
          </Stack>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: "var(--fgColor-default)",
            }}
          >
            {category.score}
          </Text>
        </Stack>

        <ProgressBar
          progress={category.score}
          bg={barColor(category.score)}
          aria-label={`${category.name} score ${category.score} out of 100`}
        />

        <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
          {passCount}/{category.checks.length} checks passed
        </Text>

        <Stack direction="vertical" gap="condensed">
          {category.checks.map((check) => (
            <Stack
              key={check.id}
              direction="horizontal"
              gap="condensed"
              align="start"
            >
              <span style={{ marginTop: 2 }}>
                <SeverityIcon severity={check.severity} />
              </span>
              <Stack direction="vertical" gap="none" style={{ flex: 1 }}>
                <Text size="small" weight="medium">
                  {check.label}
                </Text>
                <Text size="small" style={{ color: "var(--fgColor-muted)" }}>
                  {check.detail}
                </Text>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </div>
  )
}

export { barColor }
