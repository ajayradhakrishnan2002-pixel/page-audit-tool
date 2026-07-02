import { scrapePage } from "@/lib/scrape"
import {
  analyzeAccessibility,
  analyzePerformance,
  analyzeSeo,
  analyzeSocial,
  buildTechnicalRecommendations,
  computeOverall,
  detectSchema,
  extractHeadings,
  extractMeta,
  grade,
  mergeMeta,
} from "@/lib/analyze"
import { analyzeContent } from "@/lib/ai"
import type { AuditResult } from "@/lib/types"

export type AuditStageId = "scrape" | "parse" | "checks" | "schema" | "ai" | "compile"

export type AuditProgressEvent = {
  stage: AuditStageId
  status: "start" | "done"
  label: string
}

export const AUDIT_STAGES: { id: AuditStageId; label: string }[] = [
  { id: "scrape", label: "Fetching the page with Firecrawl" },
  { id: "parse", label: "Parsing HTML and metadata" },
  { id: "checks", label: "Running SEO and accessibility checks" },
  { id: "schema", label: "Detecting structured data (schema.org)" },
  { id: "ai", label: "Analyzing content with AI" },
  { id: "compile", label: "Scoring and compiling the report" },
]

export type ProgressCallback = (event: AuditProgressEvent) => void

function emit(onProgress: ProgressCallback | undefined, stage: AuditStageId, status: "start" | "done") {
  const label = AUDIT_STAGES.find((s) => s.id === stage)?.label ?? stage
  onProgress?.({ stage, status, label })
}

export function normalizeAuditUrl(input: string): string {
  let url = input.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url
}

export async function runAudit(urlInput: string, onProgress?: ProgressCallback): Promise<AuditResult> {
  const url = normalizeAuditUrl(urlInput)
  new URL(url)

  emit(onProgress, "scrape", "start")
  const page = await scrapePage(url)
  emit(onProgress, "scrape", "done")

  if (page.failed || !page.html) {
    throw new Error(page.error || "Could not retrieve that page. Check the URL and try again.")
  }

  emit(onProgress, "parse", "start")
  const meta = mergeMeta(extractMeta(page.html), page.metadata)
  const text =
    page.markdown ||
    page.html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  const headings = extractHeadings(page.html, page.markdown)
  emit(onProgress, "parse", "done")

  emit(onProgress, "checks", "start")
  const categories = [
    analyzeSeo(page.html, meta),
    analyzeAccessibility(page.html),
    analyzeSocial(page.html, meta),
    analyzePerformance(page.html, meta),
  ]
  emit(onProgress, "checks", "done")

  emit(onProgress, "schema", "start")
  const schema = detectSchema(page.html)
  const technicalRecommendations = buildTechnicalRecommendations(categories, schema, meta)
  emit(onProgress, "schema", "done")

  emit(onProgress, "ai", "start")
  const ai = await analyzeContent({
    url,
    meta,
    text,
    headings,
    categories,
    technicalIssues: technicalRecommendations.map((rec) => rec.title),
  })
  emit(onProgress, "ai", "done")

  emit(onProgress, "compile", "start")
  const overallScore = computeOverall(categories)
  const result: AuditResult = {
    url,
    fetchedAt: new Date().toISOString(),
    overallScore,
    grade: grade(overallScore),
    meta,
    categories,
    schema,
    technicalRecommendations,
    ai,
    scrapeFailed: false,
  }
  emit(onProgress, "compile", "done")

  return result
}
