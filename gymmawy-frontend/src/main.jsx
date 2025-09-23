import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import './i18n/i18n' // Initialize i18n

// Show content once React is loaded to prevent FOUC
document.body.classList.add('loaded');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
