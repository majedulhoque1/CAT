import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from './AdminNav'
import { listSkills } from '../lib/skillBanks'
import { LEVEL_IDS } from '../lib/recommendCourses'
import { describeError } from '../lib/describeError'

const MIN_PER_CELL = 3
const COSTS = ['free', 'free_audit', 'paid']
const FORMATS = ['course', 'video', 'article', 'book', 'coaching']
const BLANK = {
  id: null, skill_slug: '', subskill_ids: [], levels: [], title: '', provider: '', url: '', cost: 'free', format: 'course',
  duration_hours: '', notes: '', is_thriveabl: false, active: true, sort_weight: 0,
}

function CourseForm({ initial, skills, onSave, onCancel, saving }) {
  const [f, setF] = useState(initial)
  const skill = skills.find((s) => s.slug === f.skill_slug)
  const toggle = (key, value) => setF((p) => ({ ...p, [key]: p[key].includes(value) ? p[key].filter((x) => x !== value) : [...p[key], value] }))
  const httpsOk = /^https:\/\/\S+$/.test(f.url)
  const valid = f.skill_slug && f.subskill_ids.length && f.levels.length && f.title.trim() && f.provider.trim() && httpsOk

  return (
    <div className="panel" style={{ marginBottom: 'var(--sp-24)' }}>
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>{f.id ? 'Edit course' : 'Add course'}</p>
      <div style={{ display: 'grid', gap: 'var(--sp-16)' }}>
        <div className="field"><label htmlFor="c-title">Title</label>
          <input id="c-title" className="field-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="field"><label htmlFor="c-provider">Provider</label>
          <input id="c-provider" className="field-input" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /></div>
        <div className="field"><label htmlFor="c-url">URL (https only)</label>
          <input id="c-url" className="field-input" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value.trim() })} />
          {f.url && !httpsOk && <span className="caption">The link must start with https://</span>}</div>
        <div className="field"><label htmlFor="c-skill">Skill</label>
          <select id="c-skill" className="field-input" value={f.skill_slug} onChange={(e) => setF({ ...f, skill_slug: e.target.value, subskill_ids: [] })}>
            <option value="">Choose…</option>
            {skills.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
          </select></div>
        {skill && (
          <div className="field"><label>Subskills it covers</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-8)' }}>
              {skill.subskills.map((s) => (
                <button type="button" key={s.id} className={`a-btn${f.subskill_ids.includes(s.id) ? ' primary' : ''}`} onClick={() => toggle('subskill_ids', s.id)}>{s.label}</button>
              ))}
            </div></div>
        )}
        <div className="field"><label>Learner starting levels it suits</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-8)' }}>
            {LEVEL_IDS.map((l) => (
              <button type="button" key={l} className={`a-btn${f.levels.includes(l) ? ' primary' : ''}`} onClick={() => toggle('levels', l)}>{l}</button>
            ))}
          </div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--sp-16)' }}>
          <div className="field"><label htmlFor="c-cost">Cost</label>
            <select id="c-cost" className="field-input" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })}>{COSTS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label htmlFor="c-format">Format</label>
            <select id="c-format" className="field-input" value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })}>{FORMATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label htmlFor="c-hours">Hours</label>
            <input id="c-hours" className="field-input" inputMode="decimal" value={f.duration_hours ?? ''} onChange={(e) => setF({ ...f, duration_hours: e.target.value })} /></div>
          <div className="field"><label htmlFor="c-weight">Sort weight</label>
            <input id="c-weight" className="field-input" inputMode="numeric" value={f.sort_weight} onChange={(e) => setF({ ...f, sort_weight: e.target.value })} /></div>
        </div>
        <div className="field"><label htmlFor="c-notes">Notes</label>
          <input id="c-notes" className="field-input" value={f.notes ?? ''} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <label className="field-check"><input type="checkbox" checked={f.is_thriveabl} onChange={(e) => setF({ ...f, is_thriveabl: e.target.checked })} /><span>This is a thriveABL offer (shown at most once per report)</span></label>
        <label className="field-check"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span>Active</span></label>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sp-8)', marginTop: 'var(--sp-24)' }}>
        <button className="a-btn primary" disabled={!valid || saving} onClick={() => onSave(f)}>{saving ? 'Saving…' : 'Save'}</button>
        <button className="a-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function AdminCourses() {
  const skills = listSkills()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skill, setSkill] = useState(skills[0].slug)
  const [state, setState] = useState('all') // all | unknown | broken | inactive | search
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      await Promise.resolve()
      const { data, error: err } = await supabase.from('skill_courses').select('*').order('title').limit(2000)
      if (!active) return
      if (err) { setError(describeError(err)); setRows([]) } else { setError(''); setRows(data || []) }
      setLoading(false)
    })()
    return () => { active = false }
  }, [tick])

  const meta = skills.find((s) => s.slug === skill)
  const ofSkill = useMemo(() => rows.filter((r) => r.skill_slug === skill), [rows, skill])
  const list = useMemo(() => ofSkill.filter((r) => (
    state === 'all' ? true
      : state === 'inactive' ? !r.active
        : state === 'search' ? r.verification_method === 'search'
          : r.link_state === state)), [ofSkill, state])

  const refresh = () => { setLoading(true); setTick((t) => t + 1) }

  async function handleSave(f) {
    setSaving(true)
    const payload = {
      skill_slug: f.skill_slug, subskill_ids: f.subskill_ids, levels: f.levels, title: f.title.trim(), provider: f.provider.trim(),
      url: f.url, cost: f.cost, format: f.format, notes: f.notes?.trim() || null, is_thriveabl: f.is_thriveabl, active: f.active,
      duration_hours: f.duration_hours === '' || f.duration_hours == null ? null : Number(f.duration_hours),
      sort_weight: Number(f.sort_weight) || 0,
    }
    const { error: err } = f.id
      ? await supabase.from('skill_courses').update(payload).eq('id', f.id)
      : await supabase.from('skill_courses').insert({ ...payload, verification_method: 'page' })
    setSaving(false)
    if (err) { setError(`Save failed: ${describeError(err)}`); return }
    setEditing(null)
    refresh()
  }

  async function toggleActive(r) {
    const { error: err } = await supabase.from('skill_courses').update({ active: !r.active }).eq('id', r.id)
    if (err) { setError(`Update failed: ${describeError(err)}`); return }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)))
  }

  async function handleDelete(r) {
    if (!window.confirm(`Delete "${r.title}"? Deactivating is usually better.`)) return
    const { error: err } = await supabase.from('skill_courses').delete().eq('id', r.id)
    if (err) { setError(`Delete failed: ${describeError(err)}`); return }
    setRows((prev) => prev.filter((x) => x.id !== r.id))
  }

  const cell = (subId, level) => ofSkill.filter((c) => c.active && c.link_state !== 'broken' && c.subskill_ids.includes(subId) && c.levels.includes(level)).length

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-24)', gap: 'var(--sp-16)', flexWrap: 'wrap' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Admin Portal</p>
          <h1 className="hero-title">Courses</h1>
          <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>{rows.length} in the catalog · shown on skill reports</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
          <button className="a-btn" onClick={refresh} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button className="a-btn primary" onClick={() => setEditing({ ...BLANK, skill_slug: skill })}>Add course</button>
        </div>
      </div>

      {error && <div className="panel" role="alert"><p className="caption">{error}</p></div>}
      {editing && <CourseForm initial={editing} skills={skills} saving={saving} onSave={handleSave} onCancel={() => setEditing(null)} />}

      <div style={{ display: 'flex', gap: 'var(--sp-8)', marginBottom: 'var(--sp-16)', flexWrap: 'wrap' }}>
        {skills.map((s) => <button key={s.slug} className={`a-btn${skill === s.slug ? ' primary' : ''}`} onClick={() => setSkill(s.slug)}>{s.title}</button>)}
      </div>

      <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Coverage (active, not broken) — need {MIN_PER_CELL}+ per cell</p>
      <div className="panel" style={{ padding: 0, overflowX: 'auto', marginBottom: 'var(--sp-24)' }}>
        <table className="stimulus-table">
          <thead><tr><th>Subskill</th>{LEVEL_IDS.map((l) => <th key={l}>{l}</th>)}</tr></thead>
          <tbody>
            {meta.subskills.map((s) => (
              <tr key={s.id}>
                <td>{s.label}</td>
                {LEVEL_IDS.map((l) => {
                  const n = cell(s.id, l)
                  return <td key={l} className="mono" style={n < MIN_PER_CELL ? { background: 'var(--ink)', color: 'var(--paper)' } : undefined}>{n}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-8)', marginBottom: 'var(--sp-16)', flexWrap: 'wrap' }}>
        {[['all', 'All'], ['unknown', 'Check link'], ['broken', 'Broken'], ['search', 'Not opened directly'], ['inactive', 'Inactive']].map(([v, label]) => (
          <button key={v} className={`a-btn${state === v ? ' primary' : ''}`} onClick={() => setState(v)}>{label}</button>
        ))}
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : list.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}><p className="caption">No courses match.</p></div>
        ) : list.map((r) => (
          <div key={r.id} className="a-list-row" style={{ cursor: 'default', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={/^https:\/\//.test(r.url) ? r.url : undefined} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: 'inherit' }}>{r.title}</a>
              <div className="caption" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.provider} · {r.cost} · {r.format} · {r.subskill_ids.join(', ')} · {r.levels.join('/')}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {!r.active && <span className="a-badge fallback">Inactive</span>}
                {r.link_state !== 'ok' && <span className="a-badge fallback">link: {r.link_state}{r.last_check_status ? ` (${r.last_check_status})` : ''}</span>}
                {r.verification_method === 'search' && <span className="a-badge fallback">not opened directly</span>}
                {r.is_thriveabl && <span className="a-badge intent">thriveABL</span>}
              </div>
            </div>
            <button className="a-btn" style={{ height: 34, padding: '0 12px' }} onClick={() => setEditing({ ...r, duration_hours: r.duration_hours ?? '' })}>Edit</button>
            <button className="a-btn" style={{ height: 34, padding: '0 12px' }} onClick={() => toggleActive(r)}>{r.active ? 'Deactivate' : 'Activate'}</button>
            <button className="a-btn danger" style={{ height: 34, padding: '0 12px' }} onClick={() => handleDelete(r)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
