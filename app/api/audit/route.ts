import { NextResponse } from "next/server"
import { normalizeAuditUrl, runAudit } from "@/lib/audit-run"

export const maxDuration = 60

export async function POST(req: Request) {
  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.url) {
    return NextResponse.json({ error: "A URL is required" }, { status: 400 })
  }

  try {
    normalizeAuditUrl(body.url)
    new URL(normalizeAuditUrl(body.url))
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL" }, { status: 400 })
  }

  try {
    const result = await runAudit(body.url)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
