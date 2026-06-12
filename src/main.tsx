import React from 'react'
import ReactDOM from 'react-dom/client'
import log from 'electron-log/renderer'
import App from './App'

log.initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
