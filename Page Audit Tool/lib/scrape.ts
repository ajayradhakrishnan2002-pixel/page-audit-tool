export interface ScrapedPage {
  html: string
  markdown: string
  metadata: Record<string, unknown>
  failed: boolean
  error?: string
}

/**
 * Scrape a URL with Firecrawl. Falls back to a direct fetch when no
 * FIRECRAWL_API_KEY is configured so the tool still works locally.
 */
export async function scrapePage(url: string): Promise<ScrapedPage> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (apiKey) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["html", "markdown"],
          onlyMainContent: false,
        }),
      })

      if (!res.ok) {
        throw new Error(`Firecrawl responded ${res.status}`)
      }

      const json = await res.json()
      const data = json.data ?? json
      return {
        html: data.html ?? "",
        markdown: data.markdown ?? "",
        metadata: data.metadata ?? {},
        failed: false,
      }
    } catch (err) {
      // fall through to direct fetch
      const direct = await directFetch(url)
      if (!direct.failed) return direct
      return {
        html: "",
        markdown: "",
        metadata: {},
        failed: true,
        error: err instanceof Error ? err.message : "Firecrawl request failed",
      }
    }
  }

  return directFetch(url)
}

async function directFetch(url: string): Promise<ScrapedPage> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PageAuditBot/1.0; +https://vercel.com)",
      },
    })
    if (!res.ok) throw new Error(`Target responded ${res.status}`)
    const html = await res.text()
    return { html, markdown: "", metadata: {}, failed: false }
  } catch (err) {
    return {
      html: "",
      markdown: "",
      metadata: {},
      failed: true,
      error: err instanceof Error ? err.message : "Unable to fetch URL",
    }
  }
}
