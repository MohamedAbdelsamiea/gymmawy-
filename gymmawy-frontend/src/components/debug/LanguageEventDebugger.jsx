import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useLanguageEvents from '../../hooks/useLanguageEvents';
import languageEventService from '../../services/languageEventService';

/**
 * Debug component to monitor language event system
 * Shows real-time language change events
 */
const LanguageEventDebugger = ({ show = false }) => {
  const { i18n } = useTranslation();
  const { currentLanguage, changeCounter, rawLanguage } = useLanguageEvents();
  const [eventLog, setEventLog] = useState([]);

  useEffect(() => {
    // Subscribe to language events for logging
    const unsubscribe = languageEventService.subscribe((newLanguage) => {
      const timestamp = new Date().toLocaleTimeString();
      setEventLog(prev => [
        ...prev.slice(-4), // Keep only last 5 events
        `${timestamp}: ${newLanguage}`
      ]);
    });

    return unsubscribe;
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      zIndex: 9999,
      fontFamily: 'monospace',
      minWidth: '200px'
    }}>
      <div><strong>Language Event System</strong></div>
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
        <div>i18n.language: <span style={{color: '#ffeb3b'}}>{i18n.language}</span></div>
        <div>rawLanguage: <span style={{color: '#ffeb3b'}}>{rawLanguage}</span></div>
        <div>currentLanguage: <span style={{color: '#4caf50'}}>{currentLanguage}</span></div>
        <div>changeCounter: <span style={{color: '#2196f3'}}>{changeCounter}</span></div>
      </div>
      
      {eventLog.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ color: '#4caf50', fontSize: '10px' }}>Recent Events:</div>
          {eventLog.map((event, index) => (
            <div key={index} style={{ fontSize: '9px', color: '#81c784' }}>
              {event}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '9px', color: '#666' }}>
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default LanguageEventDebugger;
