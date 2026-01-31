import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' // Pastikan CSS global ada di sini
import GameGuard from './components/GameGuard.jsx';

// --- 4. RENDER UTAMA ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameGuard />
  </React.StrictMode>,
)