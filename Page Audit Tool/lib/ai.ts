import { generateObject } from "ai"
import { z } from "zod"
import { chatCompletionWithFallback } from "@/lib/openrouter"
import type { AiAnalysis, CategoryResult, PageMeta } from "./types"

interface AiInput {
  url: string
  meta: PageMeta
  text: string
  headings: { h1: string[]; h2: string[] }
  categories: CategoryResult[]
  technicalIssues: string[]
}

const analysisSchema = z.object({
  readability: z.number().min(0).max(100).describe("0-100, higher = easier to read"),
  clarity: z.number().min(0).max(100).describe("0-100, how clear and focused the messaging is"),
  tone: z.number().min(0).max(100).describe("0-100, how professional/consistent the tone is"),
  summary: z.string().describe("2-3 sentence assessment of content quality and messaging"),
  recommendations: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        impact: z.enum(["high", "medium", "low"]),
      }),
    )
    .min(1)
    .max(5),
})

/**
 * Run AI content analysis focused on writing quality and messaging.
 * Technical SEO issues are handled separately by buildTechnicalRecommendations.
 */
export async function analyzeContent(input: AiInput): Promise<AiAnalysis> {
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY)

  const excerpt = input.text.slice(0, 6000)
  const categorySummary = input.categories
    .map((cat) => `${cat.name}: ${cat.score}/100`)
    .join(", ")
  const technicalList =
    input.technicalIssues.length > 0
      ? input.technicalIssues.slice(0, 8).join("; ")
      : "None flagged"

  const prompt = `You are an expert content strategist and copywriter. Analyze the PAGE CONTENT below — not technical SEO setup (that is handled separately).

URL: ${input.url}
Title: ${input.meta.title ?? "(none)"}
Meta description: ${input.meta.description ?? "(none)"}
Word count: ${input.meta.wordCount}
H1 headings: ${input.headings.h1.join(" | ") || "(none)"}
H2 headings: ${input.headings.h2.slice(0, 4).join(" | ") || "(none)"}
Category scores: ${categorySummary}

Technical issues already flagged (DO NOT repeat these in recommendations):
${technicalList}

Content excerpt:
"""
${excerpt}
"""

Instructions:
- Score readability, clarity, and tone from 0-100 based on the actual writing.
- Write a concise summary about content quality, messaging, and audience fit.
- Give 3-5 CONTENT-SPECIFIC recommendations only: writing quality, messaging clarity, tone, CTAs, audience fit, content gaps, competitive positioning.
- Reference specific phrases, sections, or headings from the page when possible.
- Do NOT recommend adding title tags, meta descriptions, og:image, schema markup, or other technical fixes already listed above.`

  if (openrouterKey) {
    console.log("[analyzeContent] OpenRouter request starting")
    const started = Date.now()
    try {
      const jsonSuffix = `\n\nRespond with ONLY valid JSON (no markdown) matching: {"readability":int,"clarity":int,"tone":int,"summary":string,"recommendations":[{"title":string,"description":string,"impact":"high"|"medium"|"low"}]}`
      const { content, model } = await chatCompletionWithFallback(openrouterKey, prompt + jsonSuffix)
      const parsed = analysisSchema.parse(JSON.parse(stripFences(content)))
      console.log(`[analyzeContent] OpenRouter finished in ${Date.now() - started}ms via ${model}`)
      return normalize(parsed)
    } catch (err) {
      console.log(
        `[analyzeContent] OpenRouter failed after ${Date.now() - started}ms:`,
        (err as Error).message,
      )
    }
  }

  if (hasGateway) {
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-5-mini"
    try {
      const { object } = await generateObject({
        model,
        schema: analysisSchema,
        prompt,
        temperature: 0.3,
      })
      return normalize(object)
    } catch (err) {
      console.log("[v0] AI Gateway analysis failed:", (err as Error).message)
    }
  }

  console.log("[analyzeContent] Using heuristic fallback (no AI provider or all providers failed)")
  return heuristicAnalysis(input)
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()
}

function normalize(object: z.infer<typeof analysisSchema>): AiAnalysis {
  return {
    readability: clamp(object.readability),
    clarity: clamp(object.clarity),
    tone: clamp(object.tone),
    summary: object.summary.trim() || "No summary returned.",
    recommendations: object.recommendations.slice(0, 5),
    estimated: false,
  }
}

function clamp(n: unknown): number {
  const v = Math.round(Number(n))
  if (Number.isNaN(v)) return 50
  return Math.max(0, Math.min(100, v))
}

function heuristicAnalysis(input: AiInput): AiAnalysis {
  const { text } = input
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const words = text.split(/\s+/).filter(Boolean)
  const avgWordsPerSentence =
    sentences.length > 0 ? words.length / sentences.length : 0

  let readability = 100 - Math.abs(avgWordsPerSentence - 16) * 3
  readability = Math.max(20, Math.min(95, Math.round(readability)))

  const clarity = Math.max(
    25,
    Math.min(
      95,
      Math.round(
        (input.headings.h1.length > 0 ? 55 : 35) +
          (input.meta.wordCount > 300 ? 25 : 10) +
          (input.headings.h2.length >= 2 ? 10 : 0),
      ),
    ),
  )

  const tone = Math.max(40, Math.min(90, 70 + (input.meta.wordCount > 200 ? 10 : -10)))

  const recommendations: AiAnalysis["recommendations"] = []

  if (avgWordsPerSentence > 22) {
    recommendations.push({
      title: "Shorten long sentences",
      description: `Average sentence length is ${Math.round(avgWordsPerSentence)} words. Break up complex sentences to improve readability.`,
      impact: "high",
    })
  }

  if (input.headings.h1.length === 0) {
    recommendations.push({
      title: "Strengthen the page headline",
      description: "No clear H1 was found in the content. Add a compelling headline that states the page's primary value proposition.",
      impact: "high",
    })
  }

  if (input.meta.wordCount < 300) {
    recommendations.push({
      title: "Expand substantive content",
      description: "The page has thin content. Add more detail about services, benefits, and proof points to build trust with visitors.",
      impact: "medium",
    })
  }

  recommendations.push({
    title: "Sharpen the call-to-action",
    description: "Review whether the page has a clear, specific next step for visitors. Make the primary CTA action-oriented and visible above the fold.",
    impact: "medium",
  })

  return {
    readability,
    clarity,
    tone,
    summary:
      "Heuristic estimate based on sentence structure and content depth. Connect an AI model for deeper content and messaging analysis.",
    recommendations: recommendations.slice(0, 5),
    estimated: true,
  }
}
