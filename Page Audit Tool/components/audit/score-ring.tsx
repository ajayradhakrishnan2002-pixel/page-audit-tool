"use client"

import { useEffect, useState } from "react"

function colorFor(score: number): string {
  if (score >= 90) return "var(--fgColor-success, #3fb950)"
  if (score >= 70) return "var(--fgColor-attention, #d29922)"
  if (score >= 50) return "var(--fgColor-severe, #db6d28)"
  return "var(--fgColor-danger, #f85149)"
}

interface ScoreRingProps {
  score: number
  size?: number
  stroke?: number
  label?: string
  grade?: string
}

export function ScoreRing({
  score,
  size = 180,
  stroke = 14,
  label,
  grade,
}: ScoreRingProps) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const color = colorFor(score)

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimated(Math.round(eased * score))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const offset = circumference - (animated / 100) * circumference

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--borderColor-default)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.3s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: size / 3.4,
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--fgColor-default)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {animated}
        </span>
        {grade ? (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color,
              letterSpacing: "0.04em",
            }}
          >
            GRADE {grade}
          </span>
        ) : null}
        {label ? (
          <span style={{ fontSize: 12, color: "var(--fgColor-muted)" }}>
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}
