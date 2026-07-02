"use client"

import { Button, FormControl, Stack, TextInput } from "@primer/react"
import { GlobeIcon, SearchIcon } from "@primer/octicons-react"
import type { FormEvent } from "react"

interface AuditFormProps {
  url: string
  onUrlChange: (url: string) => void
  onSubmit: () => void
  loading: boolean
}

const EXAMPLES = ["vercel.com", "github.com", "stripe.com"]

export function AuditForm({
  url,
  onUrlChange,
  onSubmit,
  loading,
}: AuditFormProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!loading && url.trim()) onSubmit()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="vertical" gap="condensed">
        <FormControl>
          <FormControl.Label visuallyHidden>Page URL</FormControl.Label>
          <Stack
            direction="horizontal"
            gap="condensed"
            align="center"
            wrap="wrap"
          >
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <TextInput
                block
                size="large"
                leadingVisual={GlobeIcon}
                placeholder="Enter a URL to audit, e.g. vercel.com"
                value={url}
                disabled={loading}
                onChange={(e) => onUrlChange(e.target.value)}
                aria-label="Page URL"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="large"
              leadingVisual={SearchIcon}
              loading={loading}
            >
              Audit page
            </Button>
          </Stack>
        </FormControl>

        <Stack direction="horizontal" gap="condensed" align="center" wrap="wrap">
          <span style={{ fontSize: 12, color: "var(--fgColor-muted)" }}>
            Try:
          </span>
          {EXAMPLES.map((ex) => (
            <Button
              key={ex}
              variant="invisible"
              size="small"
              disabled={loading}
              onClick={() => onUrlChange(ex)}
            >
              {ex}
            </Button>
          ))}
        </Stack>
      </Stack>
    </form>
  )
}
