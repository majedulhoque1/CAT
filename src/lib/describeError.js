// Turns a thrown value from Supabase / fetch into a one-line string that keeps
// the code and message, so a failure on screen is diagnosable, not "something
// went wrong".
export function describeError(err) {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  const parts = []
  const code = err.code || err.status
  if (code) parts.push(`[${code}]`)
  parts.push(err.message || String(err))
  if (typeof err.details === 'string' && err.details) parts.push(err.details)
  if (err.hint) parts.push(`(${err.hint})`)
  return parts.join(' ')
}
