import { useTranslation } from 'react-i18next';
import { useAsset } from '../../hooks/useAsset';

const JoinUsButton = ({ className = '', onClick }) => {
  const { t, i18n } = useTranslation('home');
  const buttonImg = useAsset('button-img.webp');

  const handleJoinUsClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Scroll to packages section
    const packagesSection = document.getElementById('packages');
    if (packagesSection) {
      packagesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div
      className={`transform transition-transform duration-500 hover:scale-105 mt-4`}
    >
      <button onClick={handleJoinUsClick} className="relative cursor-pointer flex items-center">
        <img
          src={buttonImg}
          alt={t('hero.joinUs')}
        />
      </button>
    </div>
  );
};

export default JoinUsButton;
