type AuditLogMetadataBlockProps = {
  metadata: unknown
}

function formatMetadata(metadata: unknown) {
  if (metadata === null || metadata === undefined) {
    return null
  }

  return JSON.stringify(metadata, null, 2)
}

export function AuditLogMetadataBlock({ metadata }: AuditLogMetadataBlockProps) {
  const formatted = formatMetadata(metadata)

  if (!formatted) {
    return <span className="text-xs text-muted">No metadata</span>
  }

  return (
    <pre className="max-h-56 max-w-xl overflow-auto rounded-xl bg-brand-dark-background p-4 text-xs leading-5 text-brand-light-text">
      {formatted}
    </pre>
  )
}
