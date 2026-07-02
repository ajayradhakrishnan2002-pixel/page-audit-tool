const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const REQUEST_TIMEOUT_MS = 25_000
const MAX_ATTEMPTS_PER_MODEL = 3
const BASE_BACKOFF_MS = 1_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * 400)
}

/** Models tried in order: configured primary → explicit free fallback → OpenRouter free router. */
export function getOpenRouterModelChain(): string[] {
  const primary = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
  const freeFallback = process.env.OPENROUTER_FREE_MODEL || "openrouter/free"
  const chain = [primary, freeFallback, "google/gemma-3-27b-it:free"]
  return [...new Set(chain.filter(Boolean))]
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 529
}

export interface OpenRouterChatResult {
  content: string
  model: string
}

export async function chatCompletionWithFallback(
  apiKey: string,
  userContent: string,
): Promise<OpenRouterChatResult> {
  const models = getOpenRouterModelChain()
  let lastError: Error | null = null

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        console.log(`[openrouter] Trying ${model} (attempt ${attempt + 1}/${MAX_ATTEMPTS_PER_MODEL})`)
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: userContent }],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        })

        if (isRetryableStatus(res.status)) {
          const retryAfterHeader = res.headers.get("retry-after")
          const retryAfterMs = retryAfterHeader
            ? Math.max(parseInt(retryAfterHeader, 10) * 1000, BASE_BACKOFF_MS)
            : jitter(BASE_BACKOFF_MS * 2 ** attempt)
          const errText = await res.text().catch(() => `HTTP ${res.status}`)
          lastError = new Error(`OpenRouter ${model} responded ${res.status}: ${errText}`)
          console.log(`[openrouter] Retryable ${res.status} on ${model}, waiting ${retryAfterMs}ms`)
          await sleep(retryAfterMs)
          continue
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => "No error text")
          lastError = new Error(`OpenRouter ${model} responded ${res.status}: ${errText}`)
          console.log(`[openrouter] ${model} failed:`, lastError.message)
          break
        }

        const json = await res.json()
        const content = json.choices?.[0]?.message?.content
        if (!content) {
          lastError = new Error(`OpenRouter ${model} returned empty content`)
          break
        }

        console.log(`[openrouter] Success with ${model}`)
        return { content, model }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        const backoff = jitter(BASE_BACKOFF_MS * 2 ** attempt)
        console.log(`[openrouter] ${model} error: ${lastError.message}, backoff ${backoff}ms`)
        if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
          await sleep(backoff)
        }
      }
    }
  }

  throw lastError ?? new Error("All OpenRouter models failed")
}
