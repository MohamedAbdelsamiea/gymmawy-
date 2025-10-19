import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsset } from '../../hooks/useAsset';

// CSS for shine animation
const shineAnimation = `
  @keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Inject CSS if not already injected
if (typeof document !== 'undefined' && !document.getElementById('razor-button-styles')) {
  const style = document.createElement('style');
  style.id = 'razor-button-styles';
  style.textContent = shineAnimation;
  document.head.appendChild(style);
}

const JoinUsButtonNew = ({ 
  className = '', 
  onClick, 
  variant = 'default', // 'default', 'outline', 'text'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  targetElementId = 'packages', // ID of element to scroll to
  scrollOffset = 0, // Additional offset for scroll position
  showIcon = true,
  iconPosition = 'right', // 'left', 'right'
  animationType = 'scale', // 'scale', 'bounce', 'glow', 'none'
  ...props 
}) => {
  const { t, i18n } = useTranslation('home');
  const buttonImg = useAsset('button-img.webp');
  const [isPressed, setIsPressed] = useState(false);

  const handleJoinUsClick = async () => {
    if (disabled || loading) return;

    setIsPressed(true);
    
    // Reset pressed state after animation
    setTimeout(() => setIsPressed(false), 150);

    if (onClick) {
      await onClick();
      return;
    }
    
    // Scroll to target section
    const targetSection = document.getElementById(targetElementId);
    if (targetSection) {
      const elementPosition = targetSection.offsetTop - scrollOffset;
      window.scrollTo({ 
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'text-sm px-4 py-2',
    medium: 'text-base px-6 py-3',
    large: 'text-lg px-8 py-4'
  };

  // Animation classes
  const animationClasses = {
    scale: 'transform transition-transform duration-300 hover:scale-105 active:scale-95',
    bounce: 'transform transition-transform duration-300 hover:scale-110 active:scale-90',
    glow: 'transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25',
    none: 'transition-opacity duration-200 hover:opacity-90'
  };

  // Pressed state classes
  const pressedClasses = isPressed ? 'scale-95 opacity-80' : '';

  // Disabled state classes
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  // Icon component
  const Icon = () => (
    <svg 
      className={`w-5 h-5 ${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M13 7l5 5m0 0l-5 5m5-5H6" 
      />
    </svg>
  );

  // Loading spinner
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin w-5 h-5" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Render different variants
  if (variant === 'image') {
    // Original image-based button
    return (
      <div
        className={`
          ${animationClasses[animationType]} 
          ${pressedClasses}
          ${disabledClasses}
          mt-4
          ${className}
        `}
      >
        <button 
          onClick={handleJoinUsClick} 
          className="relative cursor-pointer flex items-center"
          disabled={disabled || loading}
          {...props}
        >
          <img
            src={buttonImg}
            alt={t('hero.joinUs')}
            className="w-full h-auto"
          />
        </button>
      </div>
    );
  }

  if (variant === 'razor') {
    // Custom razor-look button with gradient and arrows
    return (
      <div
        className={`
          ${animationClasses[animationType]} 
          ${pressedClasses}
          ${disabledClasses}
          mt-4
          ${className}
        `}
      >
        <button 
          onClick={handleJoinUsClick} 
          className="relative cursor-pointer group"
          disabled={disabled || loading}
          {...props}
        >
          {/* Main button with razor gradient */}
          <div 
            className="relative px-20 py-3 overflow-hidden"
            style={{
              background: 'linear-gradient(to right, #291259 0%, #4e0a78 100%)',
              boxShadow: '0 4px 15px rgba(41, 18, 89, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0px',
              clipPath: 'polygon(0 0, calc(100% - 90px) 0, 100% 100%, 0 100%)'
            }}
          >
            {/* Shine effect overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                transform: 'translateX(-100%)',
                animation: 'shine 2s infinite'
              }}
            />
            
            {/* Content container */}
            <div className="relative flex items-center justify-center space-x-3">
              {/* JOIN US text */}
              <span 
                className="font-medium text-2xl uppercase"
                style={{
                  color: '#fafcf6',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: '500'
                }}
              >
                JOIN US NOW
              </span>
              
              {/* Three triangular arrow heads overlapping like Christmas tree pattern */}
              <div className="flex items-center">
                <svg 
                  className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-200 relative z-10" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: '#fafcf6' }}
                >
                  <path d="M4 5l11 7-11 7V5z" />
                </svg>
                <svg 
                  className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-200 delay-75 relative -ml-3 z-20" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: '#fafcf6' }}
                >
                  <path d="M4 5l11 7-11 7V5z" />
                </svg>
                <svg 
                  className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-200 delay-150 relative -ml-3 z-30" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: '#fafcf6' }}
                >
                  <path d="M4 5l11 7-11 7V5z" />
                </svg>
              </div>
            </div>
            
            {/* Loading state overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </button>
      </div>
    );
  }

  // Text-based button variants
  const baseClasses = `
    inline-flex items-center justify-center
    ${sizeClasses[size]}
    font-semibold rounded-lg
    transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${animationClasses[animationType]}
    ${pressedClasses}
    ${disabledClasses}
    ${className}
  `;

  const variantClasses = {
    default: `
      bg-gradient-to-r from-blue-600 to-blue-700 
      hover:from-blue-700 hover:to-blue-800
      text-white shadow-lg hover:shadow-xl
      focus:ring-blue-500
    `,
    outline: `
      border-2 border-blue-600 
      text-blue-600 bg-transparent
      hover:bg-blue-600 hover:text-white
      focus:ring-blue-500
    `,
    text: `
      text-blue-600 bg-transparent
      hover:bg-blue-50 hover:text-blue-700
      focus:ring-blue-500
    `
  };

  return (
    <button
      onClick={handleJoinUsClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span className="ml-2">{t('common.loading', 'Loading...')}</span>
        </>
      ) : (
        <>
          {showIcon && iconPosition === 'left' && <Icon />}
          <span>{t('hero.joinUs')}</span>
          {showIcon && iconPosition === 'right' && <Icon />}
        </>
      )}
    </button>
  );
};

export default JoinUsButtonNew;
