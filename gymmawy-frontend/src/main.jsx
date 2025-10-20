import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import './i18n/i18n' // Initialize i18n

// Wait for DOM to be fully loaded before rendering to prevent layout issues
const renderApp = () => {
  // Show content once React is loaded to prevent FOUC
  document.body.classList.add('loaded');
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
};

// Use requestAnimationFrame to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  // DOM is already ready
  requestAnimationFrame(renderApp);
}
