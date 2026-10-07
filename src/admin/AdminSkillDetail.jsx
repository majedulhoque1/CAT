import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import AdminNav from './AdminNav'
import SkillResultView from '../components/skill/SkillResultView'
import { loadBank, getSkillMeta } from '../lib/skillBanks'
import { describeError } from '../lib/describeError'

export default function AdminSkillDetail() {
  const { submissionId } = useParams()
  const [state, setState] = useState({ loading: true, row: null, items: [], bank: null, error: '' })

  useEffect(() => {
    let active = true
    ;(async () => {
      await Promise.resolve()
      const { data: row, error } = await supabase.from('skill_assessment_submissions').select('*').eq('submission_id', submissionId).maybeSingle()
      if (!active) return
      if (error || !row) { setState({ loading: false, row: null, items: [], bank: null, error: error ? describeError(error) : 'Not found.' }); return }
      const { data: items, error: itemsErr } = await supabase
        .from('skill_assessment_response_items')
        .select('item_id, subskill, tier, option_id, correct_option_id, correct, ms')
        .eq('submission_id', submissionId)
      let bank = null
      try { bank = await loadBank(row.skill_slug) } catch { /* prompts are a nicety */ }
      if (!active) return
      setState({ loading: false, row, items: items || [], bank, error: itemsErr ? describeError(itemsErr) : '' })
    })()
    return () => { active = false }
  }, [submissionId])

  const { loading, row, items, bank, error } = state
  const meta = row ? getSkillMeta(row.skill_slug) : null
  const promptOf = (id) => (bank && bank.version === row.bank_version ? bank.items.find((i) => i.id === id)?.prompt : '') || ''

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <p style={{ marginBottom: 'var(--sp-16)' }}><Link to="/admin/skills" className="caption mono">← All skill results</Link></p>
      {loading && <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>}
      {error && <div className="panel" role="alert"><p className="caption">{error}</p></div>}

      {row && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 640px) minmax(0, 1fr)', gap: 'var(--sp-48)', alignItems: 'start' }} className="admin-skill-grid">
          <div>
            <SkillResultView result={row.result} skillTitle={meta?.title || row.skill_slug} firstName={row.full_name.split(/\s+/)[0]} attemptNo={row.attempt_no} readOnly />
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Person</p>
            <div className="panel">
              <p className="body" style={{ fontWeight: 500 }}>{row.full_name}</p>
              <p className="caption">{row.email}</p>
              <p className="caption mono" style={{ marginTop: 'var(--sp-8)' }}>
                {new Date(row.created_at).toLocaleString()} · v{row.bank_version} · attempt {row.attempt_no}
                {row.consent_at ? ' · consent given' : ' · no consent recorded'}
              </p>
            </div>

            <p className="eyebrow" style={{ margin: 'var(--sp-24) 0 var(--sp-8)' }}>Answers ({items.filter((i) => i.correct).length}/{items.length})</p>
            <div className="panel" style={{ padding: 0 }}>
              {items.length === 0 && <p className="caption" style={{ padding: 'var(--sp-16)' }}>No per-item rows recorded.</p>}
              {items.map((it) => (
                <div key={it.item_id} className="a-resp-row" style={{ padding: 'var(--sp-8) var(--sp-16)' }}>
                  <div style={{ minWidth: 0 }}>
                    <p className="caption mono">{it.item_id} · {it.tier}</p>
                    {promptOf(it.item_id) && <p className="caption" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>{promptOf(it.item_id)}</p>}
                  </div>
                  <span className="caption mono" style={{ flexShrink: 0 }}>
                    chose {it.option_id}{it.correct ? '' : ` · key ${it.correct_option_id}`} · {it.ms == null ? '—' : `${(it.ms / 1000).toFixed(1)}s`}
                  </span>
                  <span className="a-dot" style={{ background: it.correct ? 'var(--ink)' : 'var(--grey-300)' }}>{it.correct ? '✓' : '×'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
