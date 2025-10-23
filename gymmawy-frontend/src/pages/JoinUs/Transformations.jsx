import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../i18n/translations';
import transformationService from '../../services/transformationService';
import { config } from '../../config';
import { getFullImageUrl } from '../../utils/imageUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TransformationsPage = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadTransformations();
  }, [language]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (transformations.length <= 1) return;
      
      if (event.key === 'ArrowLeft') {
        prevImage();
      } else if (event.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [transformations.length]);

  const loadTransformations = async() => {
    try {
      setLoading(true);
      setError(null);
      const response = await transformationService.getTransformations({
        isActive: true,
        language: language,
      });
      setTransformations(response.transformations || []);
      setCurrentIndex(0); // Reset to first image when loading new transformations
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === transformations.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? transformations.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index) => {
    setCurrentIndex(index);
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
          <div className="max-w-4xl mx-auto">
            {/* Main Image Display */}
            <div className="relative bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={getFullImageUrl(transformations[currentIndex].imageUrl)}
                  alt="Transformation"
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Navigation Arrows */}
              {transformations.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6 text-[#190143]" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6 text-[#190143]" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {transformations.length}
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {transformations.length > 1 && (
              <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                {transformations.map((transformation, index) => (
                  <button
                    key={transformation.id}
                    onClick={() => goToImage(index)}
                    className={`flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      index === currentIndex 
                        ? 'ring-2 ring-[#190143] ring-opacity-50' 
                        : 'hover:ring-2 hover:ring-[#190143] hover:ring-opacity-30'
                    }`}
                  >
                    <img
                      src={getFullImageUrl(transformation.imageUrl)}
                      alt={`Transformation ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Transformation Info */}
            <div className="text-center mt-6">
              <span className="text-lg font-medium text-gymmawy-primary">
                {language === 'en' ? 'Transformation Result' : 'نتيجة التحول'}
              </span>
            </div>
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
