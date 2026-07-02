"use client"

import { AUDIT_STAGES, type AuditStageId } from "@/lib/audit-run"
import { AppTopNav } from "./app-top-nav"

export type StageStatus = "pending" | "active" | "done"

interface AuditingViewProps {
  url: string
  stageStatus: Record<AuditStageId, StageStatus>
  onCancel?: () => void
}

export function AuditingView({ url, stageStatus, onCancel }: AuditingViewProps) {
  const doneCount = AUDIT_STAGES.filter((s) => stageStatus[s.id] === "done").length
  const progressPct = Math.round((doneCount / AUDIT_STAGES.length) * 100)

  return (
    <div className="arcade-app">
      <div className="arcade-landing-bg" aria-hidden />
      <AppTopNav
        url={url}
        actions={
          onCancel ? (
            <button type="button" className="arcade-nav-action" onClick={onCancel}>
              Cancel
            </button>
          ) : null
        }
      />

      <div className="arcade-app-center">
        <div className="arcade-glass-card arcade-progress-card">
          <div className="arcade-progress-header">
            <div className="audit-spinner arcade-spinner-accent" />
            <div>
              <h2 className="arcade-card-title">Auditing your page</h2>
              <p className="arcade-card-sub">This usually takes 10–30 seconds</p>
            </div>
          </div>

          <div className="arcade-progress-bar-wrap">
            <div className="arcade-progress-labels">
              <span>Progress</span>
              <span className="arcade-progress-pct">{progressPct}%</span>
            </div>
            <span className="arcade-bar-track">
              <span className="arcade-bar-fill" style={{ width: `${progressPct}%` }} />
            </span>
          </div>

          <ul className="arcade-stage-list">
            {AUDIT_STAGES.map((stage) => {
              const status = stageStatus[stage.id] ?? "pending"
              return (
                <li
                  key={stage.id}
                  className={`arcade-stage-item arcade-stage-item--${status}`}
                >
                  <span className="arcade-stage-icon">
                    {status === "done" ? "✓" : status === "active" ? <span className="audit-spinner arcade-spinner-sm" /> : ""}
                  </span>
                  <span className="arcade-stage-label">{stage.label}</span>
                  {status === "done" ? <span className="arcade-stage-done">Done</span> : null}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function initialStageStatus(): Record<AuditStageId, StageStatus> {
  return {
    scrape: "pending",
    parse: "pending",
    checks: "pending",
    schema: "pending",
    ai: "pending",
    compile: "pending",
  }
}

export function applyProgressEvent(
  prev: Record<AuditStageId, StageStatus>,
  stage: AuditStageId,
  status: "start" | "done",
): Record<AuditStageId, StageStatus> {
  const next = { ...prev }
  if (status === "start") {
    next[stage] = "active"
    for (const s of AUDIT_STAGES) {
      if (s.id === stage) break
      next[s.id] = "done"
    }
  } else {
    next[stage] = "done"
  }
  return next
}
