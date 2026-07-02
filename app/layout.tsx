import type { Metadata } from 'next'
import './globals.css'
import { PRODUCT_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} — AI Page Audits`,
  description:
    'Audit any web page for SEO, accessibility, social metadata, structured data, and performance, with an AI-powered content review and overall score.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-audit-theme="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
