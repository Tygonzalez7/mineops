import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Global CSS animations (keep in sync with index.html inline styles)
const style = document.createElement('style')
style.textContent = `
  input, textarea, select { font-family: 'Barlow', 'Segoe UI', sans-serif; }
  button { cursor: pointer; transition: all .15s; }
  @keyframes slideUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideRight{ from { opacity:0; transform:translateX(24px) } to { opacity:1; transform:translateX(0) } }
  @keyframes popBtn    { 0%{transform:scale(1)} 40%{transform:scale(1.07)} 100%{transform:scale(1)} }
  @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
  .up { animation: slideUp   .22s ease forwards; }
  .sr { animation: slideRight .2s ease forwards; }
  .pop{ animation: popBtn     .18s ease; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
