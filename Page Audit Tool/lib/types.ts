export type Severity = "pass" | "warning" | "error"

export interface CheckResult {
  id: string
  label: string
  severity: Severity
  /** Short human-readable finding */
  detail: string
  /** Points earned out of `max` */
  score: number
  max: number
}

export interface CategoryResult {
  id: string
  name: string
  description: string
  /** 0-100 normalized score */
  score: number
  /** weight contribution to overall score (0-1) */
  weight: number
  checks: CheckResult[]
}

export interface SchemaItem {
  type: string
  found: boolean
  detail: string
}

export interface AiRecommendation {
  title: string
  description: string
  impact: "high" | "medium" | "low"
}

export interface AiAnalysis {
  /** 0-100 */
  readability: number
  /** 0-100 */
  clarity: number
  /** 0-100 */
  tone: number
  summary: string
  recommendations: AiRecommendation[]
  /** true when AI was unavailable and heuristics were used */
  estimated: boolean
}

export interface PageMeta {
  title: string | null
  description: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  canonical: string | null
  favicon: string | null
  wordCount: number
}

export interface AuditResult {
  url: string
  fetchedAt: string
  overallScore: number
  grade: string
  meta: PageMeta
  categories: CategoryResult[]
  schema: SchemaItem[]
  technicalRecommendations: AiRecommendation[]
  ai: AiAnalysis
  scrapeFailed: boolean
}
