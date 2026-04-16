function parseMetricLabels(rawLabels: string | undefined): Record<string, string> {
  if (!rawLabels) {
    return {}
  }

  return rawLabels
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .reduce<Record<string, string>>((accumulator, part) => {
      const separatorIndex = part.indexOf('=')

      if (separatorIndex < 0) {
        return accumulator
      }

      const key = part.slice(0, separatorIndex).trim()
      const rawValue = part.slice(separatorIndex + 1).trim()
      const value = rawValue.replace(/^"|"$/g, '')

      accumulator[key] = value
      return accumulator
    }, {})
}

export function getPrometheusMetricValue(metrics: string, metricName: string, labels?: Record<string, string>): number {
  const metricLines = metrics
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith(metricName))

  for (const line of metricLines) {
    const match = line.match(/^([^{\s]+)(?:\{([^}]*)\})?\s+(.+)$/)

    if (!match) {
      continue
    }

    const [, currentMetricName, rawLabels, rawValue] = match

    if (currentMetricName !== metricName) {
      continue
    }

    const parsedLabels = parseMetricLabels(rawLabels)

    const labelsMatch =
      !labels ||
      Object.entries(labels).every(([key, value]) => {
        return parsedLabels[key] === value
      })

    if (!labelsMatch) {
      continue
    }

    return Number(rawValue)
  }

  return 0
}
