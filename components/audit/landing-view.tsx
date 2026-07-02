"use client"

import { FEATURES } from "@/lib/audit-design"
import { AppTopNav } from "./app-top-nav"

interface LandingViewProps {
  url: string
  onUrlChange: (url: string) => void
  onSubmit: () => void
  loading: boolean
}

const EXAMPLES = ["vercel.com", "github.com", "stripe.com"]

export function LandingView({ url, onUrlChange, onSubmit, loading }: LandingViewProps) {
  return (
    <div className="arcade-app">
      <div className="arcade-landing-bg" aria-hidden />
      <AppTopNav />

      <main className="arcade-hero">
        <h1 className="arcade-headline">
          Your page audit,
          <br />
          built by AI in minutes.
        </h1>
        <p className="arcade-subhead">
          Scan SEO, accessibility, social metadata, structured data, and performance — then get
          prioritized fixes, AI content insights, and an overall score. No spreadsheets. No guesswork.
        </p>

        <div className="arcade-input-block">
          <form
            className="arcade-url-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!loading && url.trim()) onSubmit()
            }}
          >
            <input
              type="text"
              className="arcade-url-input"
              value={url}
              disabled={loading}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://yourwebsite.com"
              aria-label="Page URL"
            />
            <button
              type="submit"
              className="arcade-url-submit"
              disabled={loading || !url.trim()}
              aria-label="Audit page"
            >
              {loading ? <span className="audit-spinner arcade-spinner-light" /> : "↑"}
            </button>
          </form>

          <p className="arcade-try-label">
            <span className="arcade-try-arrow">↗</span>
            Try with your website!
          </p>
        </div>

        <div className="arcade-feature-pills">
          {FEATURES.map((f, i) => (
            <span
              key={f.name}
              className="arcade-feature-pill"
              style={{ animationDelay: `${i * 0.07}s, ${i * 0.3}s` }}
            >
              <span className="arcade-feature-glyph">{f.glyph}</span>
              {f.name}
            </span>
          ))}
        </div>

        <p className="arcade-examples">
          {EXAMPLES.map((ex, i) => (
            <span key={ex}>
              {i > 0 ? " · " : ""}
              <button type="button" disabled={loading} onClick={() => onUrlChange(ex)}>
                {ex}
              </button>
            </span>
          ))}
        </p>
      </main>
    </div>
  )
}
