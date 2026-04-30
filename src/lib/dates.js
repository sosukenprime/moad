// Date helpers — keep all date math in one place.

export function todayISO() {
  const d = new Date()
  return toISODate(d)
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISODate(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function longDate(date = new Date()) {
  const dow = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = date.getDate()
  return `${dow}, ${month} ${day}`.toUpperCase()
}

export function greeting(name = '') {
  const h = new Date().getHours()
  let phase
  if (h < 5) phase = 'Burning the midnight oil'
  else if (h < 12) phase = 'Good morning'
  else if (h < 17) phase = 'Good afternoon'
  else if (h < 22) phase = 'Good evening'
  else phase = 'Late night'
  return name ? `${phase}, ${name}` : phase
}

export function daysUntil(iso) {
  if (!iso) return null
  const target = fromISODate(iso)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - now) / 86400000)
}

export function isYesterday(iso) {
  if (!iso) return false
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return toISODate(y) === iso
}
