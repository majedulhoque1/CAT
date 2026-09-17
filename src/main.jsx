import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Old #/admin (etc.) bookmarks from the HashRouter era -> real paths.
// Keep for a release or two, then delete.
if (location.hash.startsWith('#/')) {
  history.replaceState(null, '', location.hash.slice(1) + location.search)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
