import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { BranchProvider } from './context/BranchContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BranchProvider>
      <App />
    </BranchProvider>
  </React.StrictMode>,
)
