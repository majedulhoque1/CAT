export const MIN_N = 30

// Per item: p-value (proportion correct) and corrected item-total correlation:
// the point-biserial between getting the item right and the rest-of-test score
// (total minus this item), so an item never correlates with itself.
export function computeItemStats(rows) {
  const totals = new Map()
  for (const r of rows) totals.set(r.submission_id, (totals.get(r.submission_id) || 0) + (r.correct ? 1 : 0))
  const byItem = new Map()
  for (const r of rows) {
    if (!byItem.has(r.item_id)) byItem.set(r.item_id, { item_id: r.item_id, tier: r.tier, subskill: r.subskill, rows: [] })
    byItem.get(r.item_id).rows.push(r)
  }
  return [...byItem.values()].map((it) => {
    const n = it.rows.length
    const correct = it.rows.filter((r) => r.correct).length
    const p = n ? correct / n : 0
    const rest = it.rows.map((r) => totals.get(r.submission_id) - (r.correct ? 1 : 0))
    const mean = rest.reduce((a, b) => a + b, 0) / (n || 1)
    const sd = Math.sqrt(rest.reduce((a, b) => a + (b - mean) ** 2, 0) / (n || 1))
    let rpb = null
    if (n >= 2 && sd > 0 && correct > 0 && correct < n) {
      const m1 = it.rows.reduce((a, r, i) => a + (r.correct ? rest[i] : 0), 0) / correct
      const m0 = it.rows.reduce((a, r, i) => a + (r.correct ? 0 : rest[i]), 0) / (n - correct)
      rpb = ((m1 - m0) / sd) * Math.sqrt(p * (1 - p))
    }
    const flags = []
    if (n >= MIN_N) {
      if (p < 0.2) flags.push('too hard')
      if (p > 0.95) flags.push('too easy')
      if (rpb !== null && rpb < 0.1) flags.push('weak discrimination')
    }
    return { item_id: it.item_id, tier: it.tier, subskill: it.subskill, n, p, rpb, flags }
  }).sort((a, b) => a.item_id.localeCompare(b.item_id))
}
