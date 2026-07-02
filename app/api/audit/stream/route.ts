import { normalizeAuditUrl, runAudit, type AuditProgressEvent } from "@/lib/audit-run"
import type { AuditResult } from "@/lib/types"

export const maxDuration = 60

type StreamLine =
  | { type: "progress"; stage: AuditProgressEvent["stage"]; status: AuditProgressEvent["status"]; label: string }
  | { type: "result"; data: AuditResult }
  | { type: "error"; message: string }

function encodeLine(line: StreamLine): string {
  return `${JSON.stringify(line)}\n`
}

export async function POST(req: Request) {
  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(encodeLine({ type: "error", message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    })
  }

  if (!body.url) {
    return new Response(encodeLine({ type: "error", message: "A URL is required" }), {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    })
  }

  try {
    normalizeAuditUrl(body.url)
    new URL(normalizeAuditUrl(body.url))
  } catch {
    return new Response(encodeLine({ type: "error", message: "That doesn't look like a valid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/x-ndjson" },
    })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const write = (line: StreamLine) => controller.enqueue(encoder.encode(encodeLine(line)))

      try {
        const result = await runAudit(body.url!, (event) => {
          write({
            type: "progress",
            stage: event.stage,
            status: event.status,
            label: event.label,
          })
        })
        write({ type: "result", data: result })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Audit failed"
        write({ type: "error", message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  })
}
