export function truncate(text: string, max = 120): string {
  if (!text || text.length <= max) return text
  return text.slice(0, max).trimEnd() + '...'
}
