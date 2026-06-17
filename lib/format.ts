// Small formatting helpers shared by server and client components.

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** "12 mars 2026" from an ISO date string. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d)
}

/** Human-readable byte size, e.g. 1.4 Go. */
export function formatBytes(bytes: number | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} o`
  const units = ['Ko', 'Mo', 'Go', 'To']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

/** Uptime in seconds → "3 j 4 h", "12 h 30 min", "5 min". */
export function formatUptime(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d} j ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

/** Fraction (0..1) → integer percent string. */
export function formatPercent(fraction: number | undefined): string {
  if (fraction == null || !Number.isFinite(fraction)) return '—'
  return `${Math.round(fraction * 100)} %`
}
