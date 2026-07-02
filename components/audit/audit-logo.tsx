export function AuditLogo({ size = 32 }: { size?: number }) {
  const icon = Math.round(size * 0.53)
  return (
    <span
      className="audit-logo-mark"
      style={{ width: size, height: size, borderRadius: size * 0.31 }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="2.6" fill="#fff" stroke="none" />
      </svg>
    </span>
  )
}
