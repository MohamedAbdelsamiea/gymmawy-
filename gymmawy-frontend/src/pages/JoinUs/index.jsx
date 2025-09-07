import { useTranslation } from 'react-i18next';

const JoinUsPage = () => {
  const { t } = useTranslation('joinUs'); // using "joinUs" namespace

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="section-title">{t('title')}</h1>
          <p className="section-subtitle mt-4">{t('subtitle')}</p>
        </div>
        
        <div className="text-center">
          <p className="text-lg text-gray-600">
            {t('underConstruction')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinUsPage;
