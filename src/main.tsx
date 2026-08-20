import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAutosave } from './lib/autosave'

// Restore any autosaved diagram before the first paint, so there's no
// flash of an empty canvas that then gets replaced.
initAutosave()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
