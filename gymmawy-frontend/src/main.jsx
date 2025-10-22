import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import './i18n/i18n' // Initialize i18n

// Wait for DOM to be fully loaded before rendering to prevent layout issues
const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
  
  // Show content once React is loaded to prevent FOUC
  // Use a small delay to ensure all styles are loaded
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 100);
};

// Wait for both DOM and styles to be ready
const initializeApp = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for fonts and styles to load
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          requestAnimationFrame(renderApp);
        });
      } else {
        requestAnimationFrame(renderApp);
      }
    });
  } else {
    // DOM is already ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(renderApp);
      });
    } else {
      requestAnimationFrame(renderApp);
    }
  }
};

initializeApp();
