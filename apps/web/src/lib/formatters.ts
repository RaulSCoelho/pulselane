const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

export function formatDateTime(value: string | null | undefined, fallback = 'Never') {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return dateTimeFormatter.format(date)
}

export function formatOptionalDateTime(value: string | null | undefined) {
  return formatDateTime(value, '—')
}

export function formatPeriodEnd(value: string | null | undefined) {
  return formatDateTime(value, 'No period end')
}

export function formatBooleanLabel(value: boolean) {
  return value ? 'Yes' : 'No'
}

export function formatLimit(value: number | null) {
  return value === null ? 'Unlimited' : String(value)
}

export function formatUsageLimit(usage: number, limit: number | null) {
  return `${usage} / ${formatLimit(limit)}`
}

export function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
}
