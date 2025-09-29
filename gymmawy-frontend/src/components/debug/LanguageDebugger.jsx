import React from 'react';
import { useTranslation } from 'react-i18next';
import useLanguageSync from '../../hooks/useLanguageSync';

/**
 * Debug component to monitor language changes
 * Add this to any page to see language change events in real-time
 */
const LanguageDebugger = ({ show = false }) => {
  const { i18n } = useTranslation();
  const { currentLanguage, languageChangeCounter, rawLanguage } = useLanguageSync();

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div><strong>Language Debugger</strong></div>
      <div>i18n.language: <span style={{color: '#ffeb3b'}}>{i18n.language}</span></div>
      <div>i18n.resolvedLanguage: <span style={{color: '#ffeb3b'}}>{i18n.resolvedLanguage}</span></div>
      <div>rawLanguage: <span style={{color: '#ffeb3b'}}>{rawLanguage}</span></div>
      <div>currentLanguage: <span style={{color: '#4caf50'}}>{currentLanguage}</span></div>
      <div>changeCounter: <span style={{color: '#2196f3'}}>{languageChangeCounter}</span></div>
      <div>Timestamp: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default LanguageDebugger;
