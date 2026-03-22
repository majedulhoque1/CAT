import { createClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

const SECTIONS = [
  {
    id: 'bigfive',
    label: '01',
    title: 'Personality',
    subtitle: 'Big Five - Goldberg (1992) IPIP',
    color: '#5856D6',
    light: '#F2F2FF',
    items: [
      { id: 'O1', text: 'I enjoy exploring abstract ideas and conceptual problems.', factor: 'O', reverse: false },
      { id: 'O2', text: 'I prefer familiar routines over trying new and different approaches.', factor: 'O', reverse: true },
      { id: 'C1', text: 'I complete tasks thoroughly and consistently meet deadlines.', factor: 'C', reverse: false },
      { id: 'C2', text: 'I often start projects but struggle to see them through to completion.', factor: 'C', reverse: true },
      { id: 'E1', text: 'I feel energised by spending time in large social gatherings.', factor: 'E', reverse: false },
      { id: 'E2', text: 'I prefer working independently rather than collaborating with a team.', factor: 'E', reverse: true },
      { id: 'A1', text: "I genuinely care about others' wellbeing and actively try to help.", factor: 'A', reverse: false },
      { id: 'A2', text: 'I tend to prioritise my own goals over maintaining group harmony.', factor: 'A', reverse: true },
      { id: 'ES1', text: 'I stay calm and composed when dealing with high-pressure situations.', factor: 'ES', reverse: false },
      { id: 'ES2', text: 'I frequently feel anxious or overwhelmed by work-related pressure.', factor: 'ES', reverse: true },
    ],
  },
  {
    id: 'riasec',
    label: '02',
    title: 'Career Interests',
    subtitle: 'RIASEC Holland Code - IIP Markers',
    color: '#34C759',
    light: '#F0FFF4',
    items: [
      { id: 'R1', text: 'I enjoy working with tools, machinery, or physical materials.', type: 'R' },
      { id: 'R2', text: 'I prefer hands-on, practical tasks over abstract or theoretical work.', type: 'R' },
      { id: 'I1', text: 'I enjoy conducting research and finding evidence-based solutions.', type: 'I' },
      { id: 'I2', text: 'I am drawn to scientific reasoning, data analysis, and problem-solving.', type: 'I' },
      { id: 'AA1', text: 'I find deep satisfaction in expressing ideas through creative work.', type: 'A' },
      { id: 'AA2', text: 'I am drawn to roles where I can design, write, or produce original output.', type: 'A' },
      { id: 'S1', text: 'I get genuine fulfilment from teaching, coaching, or supporting others.', type: 'S' },
      { id: 'S2', text: 'I prefer roles where human interaction and helping people is central.', type: 'S' },
      { id: 'EN1', text: 'I enjoy persuading, leading, and motivating others toward shared goals.', type: 'E' },
      { id: 'EN2', text: 'I am energised by competitive environments where I can take charge.', type: 'E' },
      { id: 'CV1', text: 'I prefer structured work with clear procedures and defined expectations.', type: 'C' },
      { id: 'CV2', text: 'I find satisfaction in organising data, systems, or detailed information.', type: 'C' },
    ],
  },
  {
    id: 'values',
    label: '03',
    title: 'Work Values',
    subtitle: 'O*Net Framework',
    color: '#FF9500',
    light: '#FFFBF0',
    items: [
      { id: 'WV1', text: 'Feeling a genuine sense of accomplishment from my work is essential.', value: 'Achievement' },
      { id: 'WV2', text: 'Having the freedom to make my own work decisions matters greatly to me.', value: 'Independence' },
      { id: 'WV3', text: 'Receiving acknowledgment and recognition for my contributions is important.', value: 'Recognition' },
      { id: 'WV4', text: 'Building meaningful positive relationships with colleagues is a priority.', value: 'Relationships' },
      { id: 'WV5', text: 'Having a supportive manager and team environment is critical to my output.', value: 'Support' },
      { id: 'WV6', text: 'The comfort and quality of my physical work environment impacts me deeply.', value: 'Working Conditions' },
    ],
  },
  {
    id: 'motivation',
    label: '04',
    title: 'Motivation',
    subtitle: "SDT and McClelland's Need Theory",
    color: '#FF2D55',
    light: '#FFF0F4',
    items: [
      { id: 'M1', text: 'Continuously developing my expertise and mastering new skills drives me.', driver: 'Mastery' },
      { id: 'M2', text: 'Career progression and upward advancement are key factors in my choices.', driver: 'Advancement' },
      { id: 'M3', text: 'I feel most motivated when collaborating closely with others on shared goals.', driver: 'Teamwork' },
      { id: 'M4', text: 'I need my work to contribute to something larger than individual outcomes.', driver: 'Purpose' },
      { id: 'M5', text: 'High earning potential and financial reward heavily influence my decisions.', driver: 'Financial Reward' },
      { id: 'M6', text: 'I prefer dynamic, fast-changing environments over stable, predictable ones.', driver: 'Adaptability' },
    ],
  },
]

const BF_LABELS = { O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', ES: 'Emotional Stability' }
const RI_LABELS = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' }
const BF_COLORS = { O: '#5856D6', C: '#007AFF', E: '#FF2D55', A: '#34C759', ES: '#FF9500' }
const RI_COLORS = { R: '#8E8E93', I: '#5856D6', A: '#FF2D55', S: '#34C759', E: '#FF9500', C: '#007AFF' }

const RESPONSE_ITEM_META = SECTIONS.flatMap((section) =>
  section.items.map((item, index) => ({
    id: item.id,
    sectionId: section.id,
    sectionLabel: section.label,
    sectionTitle: section.title,
    questionOrder: index + 1,
    prompt: item.text,
  })),
)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim()
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 3
}

function scoreBigFive(responses) {
  const groups = { O: [], C: [], E: [], A: [], ES: [] }
  SECTIONS[0].items.forEach((item) => {
    if (responses[item.id] !== undefined) {
      groups[item.factor].push(item.reverse ? 6 - responses[item.id] : responses[item.id])
    }
  })
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, average(values)]))
}

function scoreRIASEC(responses) {
  const groups = { R: [], I: [], A: [], S: [], E: [], C: [] }
  SECTIONS[1].items.forEach((item) => {
    if (responses[item.id] !== undefined) {
      groups[item.type].push(responses[item.id])
    }
  })
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, average(values)]))
}

function scoreValues(responses) {
  return Object.fromEntries(SECTIONS[2].items.map((item) => [item.value, responses[item.id] || 3]))
}

function scoreMotivation(responses) {
  return Object.fromEntries(SECTIONS[3].items.map((item) => [item.driver, responses[item.id] || 3]))
}

function getTop(obj, count) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, count).map(([key]) => key)
}

function pct(score) {
  return Math.round(((score - 1) / 4) * 100)
}

function buildFallbackReport(bf, ri, top3R, topVals, topMot) {
  const traits = getTop(bf, 2).map((key) => BF_LABELS[key])
  const interests = getTop(ri, 3).map((key) => RI_LABELS[key])
  return {
    headline: `${RI_LABELS[top3R[0]] || 'Adaptive'} Profile`,
    tagline: `A ${interests[0]?.toLowerCase() || 'balanced'} pattern with clear intrinsic drivers.`,
    personalitySummary: `Your personality pattern is led by ${traits.join(' and ')}. That suggests a work style shaped by how you think, organise yourself, and respond to people or pressure.`,
    careerInterestSummary: `Your strongest interest themes are ${interests.join(', ')}. You are likely to engage most in work that lets those preferences overlap in real tasks.`,
    valuesSummary: `Your strongest work values are ${topVals.join(', ')}. Those conditions are likely to matter a lot for your long-term satisfaction.`,
    motivationSummary: `Your strongest motivators are ${topMot.join(' and ')}. Work becomes easier to sustain when those drivers are built into the environment.`,
    integratedInsight: `Taken together, your profile suggests a mix of ${traits.join(' and ')} supported by a ${interests.join(', ')} interest pattern. You are likely to do best where your preferred way of working, your values, and your motivation all reinforce each other. The next useful step is testing environments that fit this combination in practice.`,
    careerMatches: ['Research associate', 'Program coordinator', 'People operations specialist', 'Strategy support analyst', 'Learning and development associate'],
    keyStrengths: ['Clear motivational drivers', 'Strong interest-based fit signals', 'Healthy awareness of work values'],
    developmentNote: 'Your growth edge is turning insight into experiments. Try short projects, internships, or role shadowing to see which environments actually match your profile.',
  }
}

function parseReport(rawText, fallback) {
  const cleaned = rawText.replace(/```json|```/gi, '').trim()
  let parsed

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Apps Script did not return valid JSON.')
    }
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
  }

  const report = parsed.parsed || parsed.report || parsed.result || parsed.data || parsed
  if (!report || typeof report !== 'object') {
    throw new Error('Apps Script response does not contain a report object.')
  }

  return {
    ...fallback,
    ...report,
    careerMatches: Array.isArray(report.careerMatches) && report.careerMatches.length ? report.careerMatches : fallback.careerMatches,
    keyStrengths: Array.isArray(report.keyStrengths) && report.keyStrengths.length ? report.keyStrengths : fallback.keyStrengths,
  }
}

async function generateReport(responses, setMsg, scriptUrl) {
  const bf = scoreBigFive(responses)
  const ri = scoreRIASEC(responses)
  const wv = scoreValues(responses)
  const mv = scoreMotivation(responses)
  const top3R = getTop(ri, 3).join('')
  const topVals = getTop(wv, 3)
  const topMot = getTop(mv, 2)
  const fallback = buildFallbackReport(bf, ri, top3R, topVals, topMot)
  const states = ['Scoring your responses...', 'Analysing personality structure...', 'Mapping career interests...', 'Synthesising your profile...']

  let index = 0
  const timer = setInterval(() => {
    index += 1
    if (index < states.length) setMsg(states[index])
  }, 1600)

  try {
    if (!scriptUrl) throw new Error('Missing VITE_GOOGLE_SCRIPT_URL in .env.')

    const prompt = `You are a senior career psychologist. Return ONLY valid JSON, no markdown, no backticks, no preamble.
Big Five (0-100%): ${Object.entries(bf).map(([k, v]) => `${BF_LABELS[k]}=${pct(v)}%`).join(', ')}
RIASEC (0-100%): ${Object.entries(ri).map(([k, v]) => `${RI_LABELS[k]}=${pct(v)}%`).join(', ')}
Top Holland Code: ${top3R}
Work Values (1-5): ${Object.entries(wv).map(([k, v]) => `${k}=${v.toFixed(1)}`).join(', ')}
Top Values: ${topVals.join(', ')}
Motivation (1-5): ${Object.entries(mv).map(([k, v]) => `${k}=${v.toFixed(1)}`).join(', ')}
Top Motivators: ${topMot.join(', ')}
Return exactly: {"headline":"3-4 word career identity label","tagline":"One evocative sentence","personalitySummary":"2-3 sentences on Big Five","careerInterestSummary":"2-3 sentences on RIASEC","valuesSummary":"1-2 sentences","motivationSummary":"1-2 sentences","integratedInsight":"3-4 sentences synthesising all four dimensions","careerMatches":["role 1","role 2","role 3","role 4","role 5"],"keyStrengths":["strength 1","strength 2","strength 3"],"developmentNote":"1-2 sentences on growth edge"}`

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({
        action: 'generateReport',
        prompt,
        payload: JSON.stringify({ responses, scores: { bf, ri, wv, mv }, top3R, topVals, topMot }),
      }).toString(),
    })

    const rawText = await response.text()
    if (!response.ok) throw new Error(`Apps Script request failed with status ${response.status}.`)
    const parsed = parseReport(rawText, fallback)
    clearInterval(timer)
    return { parsed, bf, ri, top3R, topVals, topMot, source: 'script' }
  } catch (error) {
    clearInterval(timer)
    return {
      parsed: fallback,
      bf,
      ri,
      top3R,
      topVals,
      topMot,
      source: 'fallback',
      scriptError: error instanceof Error ? error.message : 'Unable to generate a report from Apps Script.',
    }
  }
}

async function saveResults(responses, result, userInfo) {
  const submissionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`

  if (!supabase) {
    throw new Error('Missing Supabase configuration in .env.')
  }

  const submittedAt = new Date().toISOString()
  const fullName = userInfo.fullName.trim()
  const gmail = userInfo.gmail.trim().toLowerCase()
  const responseItems = RESPONSE_ITEM_META.map((item) => ({
    id: item.id,
    sectionId: item.sectionId,
    sectionLabel: item.sectionLabel,
    sectionTitle: item.sectionTitle,
    questionOrder: item.questionOrder,
    prompt: item.prompt,
    value: responses[item.id] ?? null,
  }))

  const { error } = await supabase.from('assessment_submissions').insert({
    submission_id: submissionId,
    submitted_at: submittedAt,
    full_name: fullName,
    gmail,
    holland_code: result.top3R,
    report_source: result.source,
    headline: result.parsed.headline,
    tagline: result.parsed.tagline,
    personality_summary: result.parsed.personalitySummary,
    career_interest_summary: result.parsed.careerInterestSummary,
    values_summary: result.parsed.valuesSummary,
    motivation_summary: result.parsed.motivationSummary,
    integrated_insight: result.parsed.integratedInsight,
    development_note: result.parsed.developmentNote,
    career_matches: result.parsed.careerMatches,
    key_strengths: result.parsed.keyStrengths,
    big_five_scores: result.bf,
    riasec_scores: result.ri,
    top_values: result.topVals,
    top_motivators: result.topMot,
    responses,
    response_items: responseItems,
  })

  if (error) throw new Error(error.message)

  const itemRows = responseItems.map((item) => ({
    submission_id: submissionId,
    submitted_at: submittedAt,
    full_name: fullName,
    gmail,
    question_id: item.id,
    section_id: item.sectionId,
    section_label: item.sectionLabel,
    section_title: item.sectionTitle,
    question_order: item.questionOrder,
    prompt: item.prompt,
    value: item.value,
  }))

  const { error: itemError } = await supabase.from('assessment_response_items').insert(itemRows)
  if (itemError) throw new Error(itemError.message)

  return { id: submissionId, ok: true }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
.app{min-height:100vh;background:#F2F2F7;font-family:'DM Sans',sans-serif;color:#1C1C1E}
.wrap{max-width:580px;margin:0 auto;padding:52px 18px 80px}
.card{background:#fff;border-radius:22px;padding:22px 20px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 2px 12px rgba(0,0,0,.04)}
.card-flat{background:#F2F2F7;border-radius:14px;padding:16px 18px}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8E8E93}
.hero-title{font-size:32px;font-weight:700;letter-spacing:-.6px;line-height:1.18}
.sec-title{font-size:22px;font-weight:700;letter-spacing:-.4px}
.body{font-size:15px;line-height:1.65;color:#3A3A3C}
.caption{font-size:13px;color:#8E8E93;line-height:1.5}
.row{display:flex;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid #F2F2F7}
.row:last-child{border-bottom:none;padding-bottom:0}
.icon-box{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.prog-track,.sb-track{background:#E5E5EA;border-radius:3px;overflow:hidden}
.prog-track{height:4px}.sb-track{height:5px;margin-top:5px}.prog-fill,.sb-fill{height:100%}
.lbtn{flex:1;height:46px;border-radius:13px;border:1.5px solid #E5E5EA;background:#F9F9FB;font-size:15px;font-weight:500;cursor:pointer;transition:all .16s;color:#3A3A3C;font-family:inherit}
.lbtn.sel{border-color:transparent;color:#fff;transform:scale(1.06);box-shadow:0 4px 14px rgba(0,0,0,.16)}
.btn-cta{width:100%;height:54px;border-radius:16px;border:none;font-size:17px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-cta:disabled{background:#E5E5EA!important;color:#C7C7CC!important;cursor:not-allowed}
.nav-dots{display:flex;gap:6px;justify-content:center;margin-bottom:26px}.nd{height:6px;border-radius:3px;background:#E5E5EA}.nd.active{width:22px}.nd.inactive{width:6px}.nd.done{background:#34C759}
.num-badge{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.field{display:grid;gap:6px}
.field-input{height:48px;border-radius:14px;border:1.5px solid #D1D1D6;padding:0 14px;font-size:15px;font-family:inherit;color:#1C1C1E;outline:none;background:#fff}
.field-input:focus{border-color:#007AFF;box-shadow:0 0 0 3px rgba(0,122,255,.12)}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fadeUp .45s both}
@keyframes spin{to{transform:rotate(360deg)}} .spinner{width:42px;height:42px;border-radius:50%;border:3px solid #E5E5EA;border-top-color:#007AFF;animation:spin .85s linear infinite}
`

function ScoreBar({ label, score, color }) {
  const [width, setWidth] = useState(0)
  const percentage = pct(score)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 120)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#3A3A3C' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{percentage}%</span>
      </div>
      <div className="sb-track">
        <div className="sb-fill" style={{ width: `${width}%`, background: `linear-gradient(90deg,${color}66,${color})` }} />
      </div>
    </div>
  )
}

function Welcome({ onStart, userInfo, onUserInfoChange, canStart }) {
  const rows = [
    { icon: 'BF', label: 'Big Five Personality', sub: 'Goldberg (1992) IPIP', bg: '#F2F2FF' },
    { icon: 'RI', label: 'RIASEC Career Interests', sub: 'Holland and Rounds et al.', bg: '#F0FFF4' },
    { icon: 'WV', label: 'O*Net Work Values', sub: 'Six-domain framework', bg: '#FFFBF0' },
    { icon: 'MD', label: 'Motivation Drivers', sub: 'SDT and McClelland', bg: '#FFF0F4' },
  ]

  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 12 }}>Career Identity Profile Battery</p>
      <h1 className="hero-title" style={{ marginBottom: 12 }}>
        Understand your
        <br />
        <span style={{ color: '#007AFF' }}>career self.</span>
      </h1>
      <p className="body" style={{ color: '#6D6D72', marginBottom: 22, maxWidth: 440 }}>
        A multi-construct psychometric instrument spanning personality, career interests, work values, and motivation with an AI-generated personalised report.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['34 items', '~8 min', 'AI report'].map((text) => (
          <span key={text} style={{ background: '#fff', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 500, color: '#6D6D72', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            {text}
          </span>
        ))}
      </div>

      <div className="card">
        <p className="eyebrow" style={{ color: '#007AFF', marginBottom: 12 }}>Participant Details</p>
        <div style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#3A3A3C' }}>Full Name</span>
            <input className="field-input" type="text" value={userInfo.fullName} onChange={(event) => onUserInfoChange('fullName', event.target.value)} placeholder="Enter your full name" autoComplete="name" />
          </label>
          <label className="field">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#3A3A3C' }}>Gmail</span>
            <input className="field-input" type="email" value={userInfo.gmail} onChange={(event) => onUserInfoChange('gmail', event.target.value)} placeholder="yourname@gmail.com" autoComplete="email" inputMode="email" />
          </label>
        </div>
        <p className="caption" style={{ marginTop: 10 }}>Your full name and Gmail will be saved with this assessment submission in Supabase.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map((row, index) => (
          <div key={row.label} className="row" style={{ padding: '13px 18px', borderBottom: index < rows.length - 1 ? '1px solid #F2F2F7' : 'none' }}>
            <div className="icon-box" style={{ background: row.bg, color: '#6D6D72' }}>{row.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{row.label}</div>
              <div className="caption">{row.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#F0F7FF' }}>
        <p className="caption" style={{ color: '#007AFF' }}>
          The assessment uses Apps Script for report generation and Supabase for saving identity plus every response.
        </p>
      </div>

      <button className="btn-cta" disabled={!canStart} onClick={onStart} style={canStart ? { background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', boxShadow: '0 6px 22px rgba(0,122,255,.28)' } : undefined}>
        Start Assessment <span style={{ fontSize: 18 }}>→</span>
      </button>
    </div>
  )
}

function SectionScreen({ section, secIdx, responses, onResponse, onNext, isComplete }) {
  const answered = section.items.filter((item) => responses[item.id] !== undefined).length

  return (
    <div className="fu">
      <div className="nav-dots">
        {SECTIONS.map((entry, index) => (
          <div key={entry.id} className={`nd ${index === secIdx ? 'active' : 'inactive'} ${index < secIdx ? 'done' : ''}`} style={index === secIdx ? { background: section.color } : undefined} />
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <p className="eyebrow" style={{ color: section.color, marginBottom: 6 }}>Section {section.label} of 04</p>
            <h2 className="sec-title">{section.title}</h2>
            <p className="caption" style={{ marginTop: 3 }}>{section.subtitle}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: section.color, lineHeight: 1 }}>{answered}</div>
            <div className="caption" style={{ fontSize: 11 }}>of {section.items.length}</div>
          </div>
        </div>
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${(answered / section.items.length) * 100}%`, background: section.color }} />
        </div>
      </div>

      {section.items.map((item, index) => {
        const value = responses[item.id]
        return (
          <div key={item.id} className="card">
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginBottom: 14 }}>
              <div className="num-badge" style={{ background: value ? section.color : '#F2F2F7', color: value ? '#fff' : '#8E8E93' }}>{String(index + 1).padStart(2, '0')}</div>
              <p className="body" style={{ flex: 1, fontSize: 15, paddingTop: 3 }}>{item.text}</p>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              {[1, 2, 3, 4, 5].map((option) => (
                <button key={option} className={`lbtn${value === option ? ' sel' : ''}`} style={value === option ? { background: section.color } : undefined} onClick={() => onResponse(item.id, option)}>
                  {option}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span className="caption" style={{ fontSize: 11 }}>Not at all</span>
              <span className="caption" style={{ fontSize: 11 }}>Very much</span>
            </div>
          </div>
        )
      })}

      <div style={{ marginTop: 6 }}>
        {!isComplete && <p className="caption" style={{ textAlign: 'center', marginBottom: 10, color: '#C7C7CC' }}>Answer all {section.items.length} items to continue</p>}
        <button className="btn-cta" onClick={onNext} disabled={!isComplete} style={isComplete ? { background: `linear-gradient(135deg,${section.color},${section.color}CC)`, color: '#fff', boxShadow: `0 6px 20px ${section.color}33` } : undefined}>
          {secIdx < SECTIONS.length - 1 ? 'Next Section →' : 'Generate My Report →'}
        </button>
      </div>
    </div>
  )
}

function Loading({ msg }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 18 }}>
      <div className="spinner" />
      <p className="body" style={{ color: '#007AFF', fontWeight: 500 }}>{msg}</p>
    </div>
  )
}

function ReportScreen({ data }) {
  const { parsed, bf, ri, top3R, topVals, topMot, source, scriptError, saveResult } = data
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const reportText = [
    parsed.headline,
    parsed.tagline,
    `Holland Code: ${top3R}`,
    '',
    `Big Five: ${Object.entries(bf).map(([k, v]) => `${BF_LABELS[k]} ${pct(v)}%`).join(', ')}`,
    `RIASEC: ${Object.entries(ri).map(([k, v]) => `${RI_LABELS[k]} ${pct(v)}%`).join(', ')}`,
    '',
    parsed.personalitySummary,
    parsed.careerInterestSummary,
    parsed.valuesSummary,
    parsed.motivationSummary,
    '',
    parsed.integratedInsight,
    '',
    `Career Matches: ${parsed.careerMatches.join(', ')}`,
    `Key Strengths: ${parsed.keyStrengths.join(', ')}`,
    '',
    parsed.developmentNote,
  ].join('\n')

  function handleCopy() {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleDownload() {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `Career-Report-${top3R}-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  return (
    <div className="fu">
      <div className="card" style={{ background: 'linear-gradient(140deg,#007AFF 0%,#5856D6 100%)', color: '#fff' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 10 }}>Career Identity Report</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>{parsed.headline}</h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, opacity: 0.82, fontWeight: 300, fontStyle: 'italic', marginBottom: 16 }}>{parsed.tagline}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '6px 14px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>HOLLAND CODE</span>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: 4 }}>{top3R}</span>
        </div>
      </div>

      {source === 'fallback' && <div className="card" style={{ background: '#FFFBEA' }}><p className="caption" style={{ color: '#B26A00' }}>Apps Script did not return valid report JSON, so a local fallback report is being shown instead. {scriptError}</p></div>}
      {saveResult?.ok === false && <div className="card" style={{ background: '#FFF0F4' }}><p className="caption" style={{ color: '#B00020' }}>Supabase save failed: {saveResult.error}</p></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <button onClick={handleDownload} style={{ height: 48, borderRadius: 14, border: '1.5px solid #E5E5EA', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{downloaded ? 'Downloaded!' : 'Download Report'}</button>
        <button onClick={handleCopy} style={{ height: 48, borderRadius: 14, border: '1.5px solid #E5E5EA', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? 'Copied!' : 'Copy Report'}</button>
      </div>

      <div className="card">
        <p className="eyebrow" style={{ color: '#5856D6', marginBottom: 14 }}>01 - Big Five Personality</p>
        {Object.entries(bf).map(([key, value]) => <ScoreBar key={key} label={BF_LABELS[key]} score={value} color={BF_COLORS[key]} />)}
        <div className="card-flat"><p className="body" style={{ fontSize: 14 }}>{parsed.personalitySummary}</p></div>
      </div>

      <div className="card">
        <p className="eyebrow" style={{ color: '#34C759', marginBottom: 14 }}>02 - RIASEC Career Interests</p>
        {Object.entries(ri).map(([key, value]) => <ScoreBar key={key} label={RI_LABELS[key]} score={value} color={RI_COLORS[key]} />)}
        <div className="card-flat"><p className="body" style={{ fontSize: 14 }}>{parsed.careerInterestSummary}</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <p className="eyebrow" style={{ color: '#FF9500', marginBottom: 10 }}>Work Values</p>
          {topVals.map((value, index) => (
            <div key={value} className="row" style={{ paddingTop: 8, paddingBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FF9500' }}>#{index + 1}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#6D6D72', lineHeight: 1.6, marginTop: 8 }}>{parsed.valuesSummary}</p>
        </div>
        <div className="card">
          <p className="eyebrow" style={{ color: '#FF2D55', marginBottom: 10 }}>Motivation</p>
          {topMot.map((value, index) => (
            <div key={value} className="row" style={{ paddingTop: 8, paddingBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FF2D55' }}>#{index + 1}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#6D6D72', lineHeight: 1.6, marginTop: 8 }}>{parsed.motivationSummary}</p>
        </div>
      </div>

      <div className="card" style={{ background: '#F0F7FF' }}>
        <p className="eyebrow" style={{ color: '#007AFF', marginBottom: 10 }}>Integrated Career Portrait</p>
        <p className="body">{parsed.integratedInsight}</p>
      </div>

      <div className="card">
        <p className="eyebrow" style={{ color: '#34C759', marginBottom: 14 }}>Suggested Career Directions</p>
        {parsed.careerMatches.map((match) => (
          <div key={match} className="row">
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#34C759', flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 500 }}>{match}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="eyebrow" style={{ color: '#FF9500', marginBottom: 14 }}>Key Strengths</p>
        {parsed.keyStrengths.map((strength, index) => (
          <div key={strength} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div className="num-badge" style={{ background: '#FFFBF0', color: '#FF9500' }}>0{index + 1}</div>
            <p className="body" style={{ flex: 1, fontSize: 14 }}>{strength}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#FFF0F4' }}>
        <p className="eyebrow" style={{ color: '#FF2D55', marginBottom: 10 }}>Growth Edge</p>
        <p className="body" style={{ fontSize: 14 }}>{parsed.developmentNote}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState('welcome')
  const [secIdx, setSecIdx] = useState(0)
  const [responses, setResponses] = useState({})
  const [userInfo, setUserInfo] = useState({ fullName: '', gmail: '' })
  const [report, setReport] = useState(null)
  const [loadMsg, setLoadMsg] = useState('Scoring your responses...')
  const topRef = useRef(null)
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL?.trim()
  const canStart = userInfo.fullName.trim().length > 1 && /^[^\s@]+@gmail\.com$/i.test(userInfo.gmail.trim())

  function scrollToTop() {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.scrollingElement?.scrollTo(0, 0)
    topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  useEffect(() => {
    scrollToTop()
    const frame = requestAnimationFrame(scrollToTop)
    const timer = setTimeout(scrollToTop, 40)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [phase, secIdx])

  const onResponse = (id, value) => setResponses((prev) => ({ ...prev, [id]: value }))
  const onUserInfoChange = (field, value) => setUserInfo((prev) => ({ ...prev, [field]: value }))
  const isSecComplete = () => SECTIONS[secIdx]?.items.every((item) => responses[item.id] !== undefined)

  async function handleNext() {
    scrollToTop()

    if (secIdx < SECTIONS.length - 1) {
      setSecIdx((current) => current + 1)
      requestAnimationFrame(scrollToTop)
      return
    }

    setPhase('loading')
    requestAnimationFrame(scrollToTop)

    const result = await generateReport(responses, setLoadMsg, scriptUrl)
    let saveResult

    try {
      saveResult = await saveResults(responses, result, userInfo)
    } catch (error) {
      saveResult = {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to save results to Supabase.',
      }
    }

    setReport({ ...result, saveResult })
    setPhase('report')
    requestAnimationFrame(scrollToTop)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="wrap" ref={topRef}>
          {phase === 'welcome' && <Welcome onStart={() => { scrollToTop(); setPhase('section') }} userInfo={userInfo} onUserInfoChange={onUserInfoChange} canStart={canStart} />}
          {phase === 'section' && <SectionScreen key={`${phase}-${secIdx}`} section={SECTIONS[secIdx]} secIdx={secIdx} responses={responses} onResponse={onResponse} onNext={handleNext} isComplete={isSecComplete()} />}
          {phase === 'loading' && <Loading msg={loadMsg} />}
          {phase === 'report' && report && <ReportScreen data={report} />}
        </div>
      </div>
    </>
  )
}
