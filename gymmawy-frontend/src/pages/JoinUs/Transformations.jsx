import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import transformationService from '../../services/transformationService';
import { config } from '../../config';

const TransformationsPage = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTransformations();
  }, [language]);

  const loadTransformations = async() => {
    try {
      setLoading(true);
      setError(null);
      const response = await transformationService.getTransformations({
        isActive: true,
        language: language,
      });
      setTransformations(response.transformations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
              <p className="text-gray-600">
                {language === 'en' ? 'Loading transformations...' : 'جاري تحميل التحولات...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-medium">
                  {language === 'en' ? 'Error' : 'خطأ'}
                </h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button 
                  onClick={loadTransformations}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  {language === 'en' ? 'Retry' : 'إعادة المحاولة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="section-title">
            {language === 'en' ? 'Transformations' : 'التحولات'}
          </h1>
          <p className="section-subtitle mt-4">
            {language === 'en' 
              ? 'Real results from our community members'
              : 'نتائج حقيقية من أعضاء مجتمعنا'
            }
          </p>
        </div>
        
        {transformations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {transformations.map((transformation) => (
              <div key={transformation.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={transformation.imageUrl ? (transformation.imageUrl.startsWith('http') ? transformation.imageUrl : `${config.API_BASE_URL}${transformation.imageUrl}`) : ''}
                    alt="Transformation"
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-center">
                    <span className="text-sm font-medium text-gymmawy-primary">
                      Transformation Result
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-gray-600">
              {language === 'en' 
                ? 'No transformations available at the moment. Check back later!'
                : 'لا توجد تحولات متاحة في الوقت الحالي. تحقق لاحقاً!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransformationsPage;
