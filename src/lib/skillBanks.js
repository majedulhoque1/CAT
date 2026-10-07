// Browser-side access to the PUBLIC skill banks. The registry is metadata only
// (cheap to list); a bank's items load on demand, one skill at a time, so the
// /skills page never ships question text. Answer keys (*.keys.js) are never
// imported anywhere under src/ — the glob below matches *.bank.js only.
import { listSkills, getSkillMeta } from '../../supabase/functions/_shared/skills/registry.js'

const loaders = import.meta.glob('../../supabase/functions/_shared/skills/*.bank.js')

export { listSkills, getSkillMeta }

export async function loadBank(slug) {
  if (!getSkillMeta(slug)) return null
  const loader = loaders[`../../supabase/functions/_shared/skills/${slug}.bank.js`]
  if (!loader) return null
  return (await loader()).default
}
