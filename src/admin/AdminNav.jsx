import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/admin', label: 'Submissions', end: true },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/availability', label: 'Availability' },
]

export default function AdminNav() {
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-8)', marginBottom: 'var(--sp-24)', borderBottom: '1px solid var(--grey-200)', paddingBottom: 'var(--sp-8)' }}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `a-btn${isActive ? ' primary' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
