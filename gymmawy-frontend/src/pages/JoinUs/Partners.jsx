import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';

const PartnersPage = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="section-title">{t.partners.title}</h1>
          <p className="section-subtitle mt-4">{t.partners.subtitle}</p>
        </div>
        
        <div className="text-center">
          <p className="text-lg text-gray-600">
            {language === 'en' 
              ? 'This page is under construction. Please check back later.'
              : 'هذه الصفحة قيد الإنشاء. يرجى التحقق لاحقاً.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;
