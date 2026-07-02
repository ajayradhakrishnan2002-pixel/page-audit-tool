"use client"

import { useRef, useState } from "react"
import type { AuditStageId } from "@/lib/audit-run"
import type { AuditResult } from "@/lib/types"
import { AuditThemeProvider } from "./theme-provider"
import { LandingView } from "./landing-view"
import { ResultsDashboard } from "./results-dashboard"
import {
  AuditingView,
  applyProgressEvent,
  initialStageStatus,
  type StageStatus,
} from "./auditing-view"

type View = "landing" | "auditing" | "results"

export function PageAudit() {
  const [view, setView] = useState<View>("landing")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [stageStatus, setStageStatus] = useState<Record<AuditStageId, StageStatus>>(initialStageStatus)
  const abortRef = useRef<AbortController | null>(null)

  async function runAudit() {
    setError(null)
    setResult(null)
    setStageStatus(initialStageStatus())
    setView("auditing")

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/audit/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Audit request failed")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as
            | { type: "progress"; stage: AuditStageId; status: "start" | "done" }
            | { type: "result"; data: AuditResult }
            | { type: "error"; message: string }

          if (event.type === "progress") {
            setStageStatus((prev) => applyProgressEvent(prev, event.stage, event.status))
          } else if (event.type === "result") {
            setResult(event.data)
            setView("results")
          } else if (event.type === "error") {
            throw new Error(event.message)
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setView("landing")
        return
      }
      setError(err instanceof Error ? err.message : "Something went wrong while auditing the page.")
      setView("landing")
    } finally {
      abortRef.current = null
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    setView("landing")
  }

  function handleNewAudit() {
    setResult(null)
    setError(null)
    setStageStatus(initialStageStatus())
    setView("landing")
  }

  return (
    <AuditThemeProvider>
      <div className="audit-app">
        {view === "results" && result ? (
          <ResultsDashboard result={result} onNewAudit={handleNewAudit} />
        ) : view === "auditing" ? (
          <AuditingView url={url} stageStatus={stageStatus} onCancel={handleCancel} />
        ) : (
          <>
            <LandingView
              url={url}
              onUrlChange={setUrl}
              onSubmit={runAudit}
              loading={false}
            />
            {error ? (
              <div style={{ maxWidth: 580, margin: "16px auto 0", padding: "0 24px" }}>
                <div className="audit-error">{error}</div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AuditThemeProvider>
  )
}
