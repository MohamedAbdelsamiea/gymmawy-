import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusBadge = ({ status, variant = 'default' }) => {
  const { t } = useTranslation("dashboard");
  
  const statusLower = status.toLowerCase();
  
  const getStatusConfig = (status) => {
    if (statusLower.includes('active') || statusLower.includes('completed') || statusLower.includes('delivered')) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        dot: 'bg-green-400',
      };
    }
    
    if (statusLower.includes('pending') || statusLower.includes('processing')) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        dot: 'bg-yellow-400',
      };
    }
    
    if (statusLower.includes('shipped') || statusLower.includes('in progress')) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        dot: 'bg-blue-400',
      };
    }
    
    if (statusLower.includes('cancelled') || statusLower.includes('failed') || statusLower.includes('expired')) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        dot: 'bg-red-400',
      };
    }
    
    if (statusLower.includes('draft') || statusLower.includes('inactive')) {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        dot: 'bg-gray-400',
      };
    }
    
    // Default
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-400',
    };
  };

  const config = getStatusConfig(status);

  // Get translated status text
  const translatedStatus = (() => {
    const translation = t(`common.${statusLower}`);
    // Handle case where translation might return an object
    if (typeof translation === 'object' && translation !== null) {
      return translation.en || translation.ar || status;
    }
    return translation || status;
  })();

  if (variant === 'dot') {
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config.dot} mr-2`}></div>
        <span className={`text-sm font-medium ${config.text}`}>{translatedStatus}</span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {translatedStatus}
    </span>
  );
};

export default StatusBadge;
