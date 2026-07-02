import type {
  AiRecommendation,
  CategoryResult,
  CheckResult,
  PageMeta,
  SchemaItem,
  Severity,
} from "./types"

/* ---------------- HTML helpers ---------------- */

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i")
  const m = tag.match(re)
  return m ? m[1].trim() : null
}

function matchAll(html: string, re: RegExp): string[] {
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) out.push(m[0])
  return out
}

function metaContent(html: string, key: "name" | "property", value: string) {
  const tags = matchAll(html, /<meta\b[^>]*>/gi)
  for (const t of tags) {
    if (attr(t, key)?.toLowerCase() === value.toLowerCase()) {
      return attr(t, "content")
    }
  }
  return null
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/* ---------------- Meta extraction ---------------- */

function firstH1Text(html: string): string | null {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  if (!match) return null
  const text = stripTags(match[1]).trim()
  return text || null
}

function scrapedString(scraped: Record<string, unknown>, key: string): string | null {
  const value = scraped[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function extractMeta(html: string): PageMeta {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const titleFromTag = titleMatch ? titleMatch[1].trim() : null
  const description = metaContent(html, "name", "description")
  const ogTitle = metaContent(html, "property", "og:title")
  const ogDescription = metaContent(html, "property", "og:description")
  const ogImage = metaContent(html, "property", "og:image")

  const canonicalTag = matchAll(html, /<link\b[^>]*>/gi).find(
    (t) => attr(t, "rel")?.toLowerCase() === "canonical",
  )
  const canonical = canonicalTag ? attr(canonicalTag, "href") : null

  const faviconTag = matchAll(html, /<link\b[^>]*>/gi).find((t) =>
    (attr(t, "rel") ?? "").toLowerCase().includes("icon"),
  )
  const favicon = faviconTag ? attr(faviconTag, "href") : null

  const text = stripTags(html)
  const wordCount = text ? text.split(/\s+/).length : 0
  const title = titleFromTag ?? ogTitle ?? firstH1Text(html)

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    canonical,
    favicon,
    wordCount,
  }
}

export function mergeMeta(htmlMeta: PageMeta, scraped: Record<string, unknown>): PageMeta {
  const fcTitle = scrapedString(scraped, "title")
  const fcDescription = scrapedString(scraped, "description")
  const fcOgTitle = scrapedString(scraped, "ogTitle")
  const fcOgDescription = scrapedString(scraped, "ogDescription")
  const fcOgImage = scrapedString(scraped, "ogImage")
  const fcCanonical = scrapedString(scraped, "ogUrl") ?? scrapedString(scraped, "sourceURL")
  const fcFavicon = scrapedString(scraped, "favicon")

  return {
    title: htmlMeta.title ?? fcTitle ?? fcOgTitle,
    description: htmlMeta.description ?? fcDescription ?? fcOgDescription,
    ogTitle: htmlMeta.ogTitle ?? fcOgTitle ?? fcTitle,
    ogDescription: htmlMeta.ogDescription ?? fcOgDescription ?? fcDescription,
    ogImage: htmlMeta.ogImage ?? fcOgImage,
    canonical: htmlMeta.canonical ?? fcCanonical,
    favicon: htmlMeta.favicon ?? fcFavicon,
    wordCount: htmlMeta.wordCount,
  }
}

/* ---------------- Category scoring ---------------- */

function pct(checks: CheckResult[]): number {
  const max = checks.reduce((s, c) => s + c.max, 0)
  const got = checks.reduce((s, c) => s + c.score, 0)
  return max === 0 ? 0 : Math.round((got / max) * 100)
}

export function analyzeSeo(html: string, meta: PageMeta): CategoryResult {
  const checks: CheckResult[] = []

  // Title
  if (!meta.title) {
    checks.push(c("title", "Title tag", "error", "No <title> tag found", 0, 10))
  } else {
    const len = meta.title.length
    if (len >= 30 && len <= 60) {
      checks.push(c("title", "Title tag", "pass", `Good length (${len} chars)`, 10, 10))
    } else {
      checks.push(
        c("title", "Title tag", "warning", `Length is ${len} chars (aim for 30–60)`, 5, 10),
      )
    }
  }

  // Meta description
  if (!meta.description) {
    checks.push(c("desc", "Meta description", "error", "Missing meta description", 0, 10))
  } else {
    const len = meta.description.length
    if (len >= 120 && len <= 160) {
      checks.push(c("desc", "Meta description", "pass", `Good length (${len} chars)`, 10, 10))
    } else {
      checks.push(
        c("desc", "Meta description", "warning", `Length is ${len} chars (aim for 120–160)`, 5, 10),
      )
    }
  }

  // H1
  const h1s = matchAll(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/gi)
  if (h1s.length === 1) {
    checks.push(c("h1", "H1 heading", "pass", "Exactly one H1 found", 10, 10))
  } else if (h1s.length === 0) {
    checks.push(c("h1", "H1 heading", "error", "No H1 heading found", 0, 10))
  } else {
    checks.push(c("h1", "H1 heading", "warning", `${h1s.length} H1 tags (use one)`, 4, 10))
  }

  // Heading structure
  const hasH2 = /<h2\b/i.test(html)
  checks.push(
    hasH2
      ? c("headings", "Subheadings", "pass", "Uses H2 subheadings", 6, 6)
      : c("headings", "Subheadings", "warning", "No H2 subheadings found", 2, 6),
  )

  // Canonical
  checks.push(
    meta.canonical
      ? c("canonical", "Canonical URL", "pass", "Canonical link present", 6, 6)
      : c("canonical", "Canonical URL", "warning", "No canonical link", 2, 6),
  )

  // Viewport
  const hasViewport = !!metaContent(html, "name", "viewport")
  checks.push(
    hasViewport
      ? c("viewport", "Mobile viewport", "pass", "Viewport meta present", 6, 6)
      : c("viewport", "Mobile viewport", "error", "No viewport meta tag", 0, 6),
  )

  // lang attribute
  const hasLang = /<html\b[^>]*\blang\s*=/i.test(html)
  checks.push(
    hasLang
      ? c("lang", "Language attribute", "pass", "html[lang] is set", 4, 4)
      : c("lang", "Language attribute", "warning", "No lang attribute on <html>", 1, 4),
  )

  return {
    id: "seo",
    name: "SEO & Metadata",
    description: "Title, description, headings, and crawlability signals.",
    score: pct(checks),
    weight: 0.3,
    checks,
  }
}

export function analyzeAccessibility(html: string): CategoryResult {
  const checks: CheckResult[] = []

  // Image alt text
  const imgs = matchAll(html, /<img\b[^>]*>/gi)
  if (imgs.length === 0) {
    checks.push(c("alt", "Image alt text", "pass", "No images to evaluate", 10, 10))
  } else {
    const withAlt = imgs.filter((t) => attr(t, "alt") !== null).length
    const ratio = withAlt / imgs.length
    if (ratio === 1) {
      checks.push(c("alt", "Image alt text", "pass", `All ${imgs.length} images have alt text`, 10, 10))
    } else if (ratio >= 0.6) {
      checks.push(
        c("alt", "Image alt text", "warning", `${withAlt}/${imgs.length} images have alt text`, 5, 10),
      )
    } else {
      checks.push(
        c("alt", "Image alt text", "error", `Only ${withAlt}/${imgs.length} images have alt text`, 0, 10),
      )
    }
  }

  // Document language (a11y too)
  const hasLang = /<html\b[^>]*\blang\s*=/i.test(html)
  checks.push(
    hasLang
      ? c("a11y-lang", "Document language", "pass", "Language declared", 6, 6)
      : c("a11y-lang", "Document language", "error", "No document language", 0, 6),
  )

  // Landmarks
  const hasMain = /<main\b/i.test(html)
  checks.push(
    hasMain
      ? c("main", "Main landmark", "pass", "<main> landmark present", 6, 6)
      : c("main", "Main landmark", "warning", "No <main> landmark", 2, 6),
  )

  // aria usage / buttons with labels
  const hasNav = /<nav\b/i.test(html)
  checks.push(
    hasNav
      ? c("nav", "Navigation landmark", "pass", "<nav> landmark present", 4, 4)
      : c("nav", "Navigation landmark", "warning", "No <nav> landmark", 1, 4),
  )

  // Inputs with labels
  const inputs = matchAll(html, /<input\b[^>]*>/gi).filter(
    (t) => (attr(t, "type") ?? "text") !== "hidden",
  )
  if (inputs.length === 0) {
    checks.push(c("labels", "Form labels", "pass", "No form inputs to evaluate", 6, 6))
  } else {
    const labelled = inputs.filter(
      (t) => attr(t, "aria-label") || attr(t, "id") || attr(t, "placeholder"),
    ).length
    checks.push(
      labelled === inputs.length
        ? c("labels", "Form labels", "pass", "Inputs appear labelled", 6, 6)
        : c("labels", "Form labels", "warning", `${labelled}/${inputs.length} inputs labelled`, 3, 6),
    )
  }

  return {
    id: "a11y",
    name: "Accessibility",
    description: "Alt text, landmarks, language, and form labelling.",
    score: pct(checks),
    weight: 0.25,
    checks,
  }
}

export function analyzeSocial(html: string, meta: PageMeta): CategoryResult {
  const checks: CheckResult[] = []

  checks.push(
    meta.ogTitle
      ? c("og-title", "Open Graph title", "pass", "og:title present", 8, 8)
      : c("og-title", "Open Graph title", "warning", "Missing og:title", 2, 8),
  )
  checks.push(
    meta.ogDescription
      ? c("og-desc", "Open Graph description", "pass", "og:description present", 8, 8)
      : c("og-desc", "Open Graph description", "warning", "Missing og:description", 2, 8),
  )
  checks.push(
    meta.ogImage
      ? c("og-image", "Open Graph image", "pass", "og:image present", 8, 8)
      : c("og-image", "Open Graph image", "error", "Missing og:image", 0, 8),
  )

  const twitterCard = metaContent(html, "name", "twitter:card")
  checks.push(
    twitterCard
      ? c("twitter", "Twitter card", "pass", `twitter:card = ${twitterCard}`, 6, 6)
      : c("twitter", "Twitter card", "warning", "No twitter:card tag", 2, 6),
  )

  return {
    id: "social",
    name: "Social Sharing",
    description: "Open Graph and Twitter card metadata for rich previews.",
    score: pct(checks),
    weight: 0.15,
    checks,
  }
}

export function analyzePerformance(html: string, meta: PageMeta): CategoryResult {
  const checks: CheckResult[] = []

  // Page weight (rough, from HTML size)
  const kb = Math.round(html.length / 1024)
  if (kb <= 150) {
    checks.push(c("size", "HTML payload", "pass", `${kb} KB of HTML`, 8, 8))
  } else if (kb <= 400) {
    checks.push(c("size", "HTML payload", "warning", `${kb} KB of HTML (consider trimming)`, 4, 8))
  } else {
    checks.push(c("size", "HTML payload", "error", `${kb} KB of HTML is heavy`, 1, 8))
  }

  // Inline styles count
  const inlineStyles = matchAll(html, /style\s*=\s*["']/gi).length
  checks.push(
    inlineStyles <= 15
      ? c("inline", "Inline styles", "pass", `${inlineStyles} inline style attrs`, 6, 6)
      : c("inline", "Inline styles", "warning", `${inlineStyles} inline styles (extract to CSS)`, 2, 6),
  )

  // Image lazy loading
  const imgs = matchAll(html, /<img\b[^>]*>/gi)
  if (imgs.length === 0) {
    checks.push(c("lazy", "Image lazy-loading", "pass", "No images to evaluate", 6, 6))
  } else {
    const lazy = imgs.filter((t) => /loading\s*=\s*["']lazy["']/i.test(t)).length
    checks.push(
      lazy / imgs.length >= 0.5
        ? c("lazy", "Image lazy-loading", "pass", `${lazy}/${imgs.length} images lazy-load`, 6, 6)
        : c("lazy", "Image lazy-loading", "warning", `${lazy}/${imgs.length} images lazy-load`, 2, 6),
    )
  }

  // Content depth
  checks.push(
    meta.wordCount >= 300
      ? c("content", "Content depth", "pass", `${meta.wordCount} words of content`, 5, 5)
      : c("content", "Content depth", "warning", `${meta.wordCount} words (thin content)`, 2, 5),
  )

  return {
    id: "perf",
    name: "Performance",
    description: "Payload size, inline styles, lazy-loading, and content depth.",
    score: pct(checks),
    weight: 0.1,
    checks,
  }
}

/* ---------------- Schema detection ---------------- */

export function detectSchema(html: string): SchemaItem[] {
  const blocks = matchAll(
    html,
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )

  const foundTypes = new Set<string>()
  for (const block of blocks) {
    const inner = block.replace(/<[^>]+>/g, "")
    try {
      const parsed = JSON.parse(inner)
      collectTypes(parsed, foundTypes)
    } catch {
      // also catch @type via regex if JSON is malformed
      const tm = inner.match(/"@type"\s*:\s*"([^"]+)"/g)
      tm?.forEach((t) => {
        const v = t.match(/"@type"\s*:\s*"([^"]+)"/)
        if (v) foundTypes.add(v[1])
      })
    }
  }

  const common = [
    { type: "Organization", label: "Organization" },
    { type: "WebSite", label: "WebSite" },
    { type: "WebPage", label: "WebPage" },
    { type: "BreadcrumbList", label: "Breadcrumbs" },
    { type: "Article", label: "Article" },
    { type: "Product", label: "Product" },
    { type: "FAQPage", label: "FAQ" },
  ]

  const items: SchemaItem[] = common.map((s) => ({
    type: s.label,
    found: foundTypes.has(s.type),
    detail: foundTypes.has(s.type) ? "JSON-LD detected" : "Not found",
  }))

  // include any extra types found that aren't in the common list
  const known = new Set(common.map((c) => c.type))
  for (const t of foundTypes) {
    if (!known.has(t)) {
      items.push({ type: t, found: true, detail: "JSON-LD detected" })
    }
  }

  if (blocks.length === 0) {
    items.unshift({
      type: "Structured data",
      found: false,
      detail: "No JSON-LD blocks found on the page",
    })
  }

  return items
}

function collectTypes(node: unknown, out: Set<string>) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out))
    return
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>
    const t = obj["@type"]
    if (typeof t === "string") out.add(t)
    if (Array.isArray(t)) t.forEach((v) => typeof v === "string" && out.add(v))
    if (Array.isArray(obj["@graph"])) collectTypes(obj["@graph"], out)
    Object.values(obj).forEach((v) => {
      if (v && typeof v === "object") collectTypes(v, out)
    })
  }
}

/* ---------------- helpers ---------------- */

function c(
  id: string,
  label: string,
  severity: CheckResult["severity"],
  detail: string,
  score: number,
  max: number,
): CheckResult {
  return { id, label, severity, detail, score, max }
}

export function computeOverall(categories: CategoryResult[]): number {
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0)
  const weighted = categories.reduce((s, c) => s + c.score * c.weight, 0)
  return Math.round(weighted / totalWeight)
}

export function grade(score: number): string {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

const CHECK_IMPACT: Record<Severity, AiRecommendation["impact"]> = {
  error: "high",
  warning: "medium",
  pass: "low",
}

export function buildTechnicalRecommendations(
  categories: CategoryResult[],
  schema: SchemaItem[],
  _meta: PageMeta,
): AiRecommendation[] {
  const recs: AiRecommendation[] = []

  for (const category of categories) {
    for (const check of category.checks) {
      if (check.severity === "pass") continue
      recs.push({
        title: `${category.name}: ${check.label}`,
        description: check.detail,
        impact: CHECK_IMPACT[check.severity],
      })
    }
  }

  const missingSchema = schema.filter((item) => !item.found && item.type !== "Structured data")

  if (schema.some((item) => item.type === "Structured data" && !item.found)) {
    recs.push({
      title: "Implement JSON-LD structured data",
      description: "This page has no schema.org JSON-LD blocks. Add Organization, WebPage, or Product markup as appropriate.",
      impact: "medium",
    })
  } else if (missingSchema.length > 0) {
    const types = missingSchema.map((item) => item.type).slice(0, 4).join(", ")
    recs.push({
      title: "Add structured data (schema.org)",
      description: `Missing schema types: ${types}. Adding relevant JSON-LD helps search engines understand this page.`,
      impact: "medium",
    })
  }

  const impactOrder: Record<AiRecommendation["impact"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  }

  return recs
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 10)
}

export function extractHeadings(html: string, markdown: string): { h1: string[]; h2: string[] } {
  function headingTexts(source: string, tag: "h1" | "h2"): string[] {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi")
    const out: string[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(source)) !== null) {
      const text = stripTags(m[1]).trim()
      if (text) out.push(text)
    }
    return out
  }

  const h1FromHtml = headingTexts(html, "h1")
  const h2FromHtml = headingTexts(html, "h2")

  if (h1FromHtml.length > 0 || h2FromHtml.length > 0) {
    return { h1: h1FromHtml.slice(0, 3), h2: h2FromHtml.slice(0, 6) }
  }

  const h1FromMd = [...markdown.matchAll(/^#\s+(.+)$/gm)].map((m) => m[1].trim()).filter(Boolean)
  const h2FromMd = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim()).filter(Boolean)

  return { h1: h1FromMd.slice(0, 3), h2: h2FromMd.slice(0, 6) }
}
