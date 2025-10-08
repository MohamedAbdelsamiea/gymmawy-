import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Programme from "../../components/common/Programme";
import { useAsset } from "../../hooks/useAsset";
import { useCurrencyContext } from "../../contexts/CurrencyContext";
import programmeService from "../../services/programmeService";

const TrainingProgramsPage = () => {
  const { t, i18n } = useTranslation("programmes"); // use the namespace
  const { currency, isLoading: currencyLoading, formatPrice, getCurrencyInfo } = useCurrencyContext();
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const card1Bg = useAsset("programmes/card1-bg.webp", "common");
  const card1Icon = useAsset("programmes/card1-icon.webp", "common");
  const card2Bg = useAsset("programmes/card2-bg.webp", "common");
  const card2Icon = useAsset("programmes/card2-icon.webp", "common");
  const card3Bg = useAsset("programmes/card3-bg.webp", "common");
  const card3Icon = useAsset("programmes/card3-icon.webp", "common");

  const prog1 = useAsset("programmes/psycho-gymmawy.webp", "common");
  const prog2 = useAsset("programmes/upper-and-lower.webp", "common");
  const prog3 = useAsset("programmes/push-pull-legs.webp", "common");
  const prog4 = useAsset("programmes/the-arnold-split.webp", "common");
  const prog5 = useAsset("programmes/3-days-fullbody.webp", "common");
  const prog6 = useAsset("programmes/female-upper-and-lower.webp", "common");
  const prog7 = useAsset("programmes/kon-gymmawy.webp", "common");

  const text1 = useAsset("programmes/programmes-text1.webp");
  const text2 = useAsset("programmes/programmes-text2.webp");

  const programmesBg = useAsset("home/results/results-bg.webp", "common");

  useEffect(() => {
    loadProgrammes();
  }, [i18n.language]);

  // Debug logging
  useEffect(() => {
    console.log('Programmes state:', { programmes, loading, error });
  }, [programmes, loading, error]);

  const loadProgrammes = async() => {
    try {
      setLoading(true);
      setError(null);
      const response = await programmeService.getProgrammes({ lang: i18n.language }); // Pass current language
      console.log('Programmes API response:', response);
      const programmes = response.items || [];
      console.log('Programmes loaded:', programmes.length, 'programmes');
      
      if (programmes.length === 0) {
        console.log('No programmes found in API response');
        setProgrammes([]);
      } else {
        setProgrammes(programmes);
      }
    } catch (err) {
      console.error('API failed:', err.message);
      setError(err.message);
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      background: card1Bg,
      icon: card1Icon,
      title: t("Cards.0.title"),
      description: t("Cards.0.description"),
    },
    {
      background: card2Bg,
      icon: card2Icon,
      title: t("Cards.1.title"),
      description: t("Cards.1.description"),
    },
    {
      background: card3Bg,
      icon: card3Icon,
      title: t("Cards.2.title"),
      description: t("Cards.2.description"),
    },
  ];

  const fallbackProgrammes = [
    {
      id: 1,
      image: prog1,
      name: t("ProgrammesList.0.name"),
      priceEGP: 299,
      priceSAR: 149,
    },
    {
      id: 2,
      image: prog2,
      name: t("ProgrammesList.1.name"),
      priceEGP: 299,
      priceSAR: 149,
    },
    {
      id: 3,
      image: prog3,
      name: t("ProgrammesList.2.name"),
      priceEGP: 299,
      priceSAR: 149,
    },
    {
      id: 4,
      image: prog4,
      name: t("ProgrammesList.3.name"),
      priceEGP: 299,
      priceSAR: 149,
    },
    {
      id: 5,
      image: prog5,
      name: t("ProgrammesList.4.name"),
      priceEGP: 299,
      priceSAR: 149,
    },
    {
      id: 6,
      image: prog6,
      name: t("ProgrammesList.5.name"),
      priceEGP: 299,
      priceSAR: 149,
    },
    {
      id: 7,
      image: prog7,
      name: t("ProgrammesList.6.name"),
      priceEGP: 299,
      priceSAR: 149,
    },
  ];

  return (
    <div className="w-full">
      {/* Advantages Section */}
      <section className="md:py-20 py-12 bg-[#ebebeb] text-center">
        <h2 className="text-xl md:text-3xl tracking-wider text-[#190143]">
          {t("title")}
        </h2>
        <img
          src={text1}
          alt="Programmes Text"
          loading="lazy"
          className="w-full h-auto w-auto min-w-xl rtl:max-w-xl ltr:max-w-none sm:ltr:max-w-4xl mx-auto mt-10 mb-10 sm:mt-6 sm:mb-6 object-contain px-4 md:px-0 rtl:scale-100 ltr:scale-150 sm:ltr:scale-100"
        />
        <p className="max-w-7xl text-xl md:text-3xl font-bold mx-auto text-[#190143] md:mb-12 mb-8 md:mt-14 mt-8">
          {t("description")}
        </p>

        {/* Reused Feature Cards */}
        <div className="max-w-[1300px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
            {featureCards.map((card, index) => (
              <div
                key={index}
                className="relative rounded-2xl overflow-hidden bg-cover bg-center min-h-[160px] transition-all duration-700 ease-out"
                style={{ backgroundImage: `url(${card.background})` }}
              >
                <div className="relative p-5 pt-8 h-full flex flex-col">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={card.icon}
                        alt="Card Icon"
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <h3 className="text-2xl font-bold text-[#ebebeb] mb-4">
                        {card.title}
                      </h3>
                      <p className="text-[#ebebeb] text-sm leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes Section */}
      <section
        className="md:py-20 py-12 bg-[#190143] text-center text-[#ebebeb]"
        style={{
          backgroundImage: `url(${programmesBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h3 className="text-xl md:text-3xl tracking-widest md:mt-8 mt-4 md:mb-8 mb-4">
          {t("programmesLabel")}
        </h3>
        <img
          src={text2}
          alt="Programmes Text"
          loading="lazy"
          className="w-full h-auto rtl:max-w-xl ltr:max-w-none sm:ltr:max-w-5xl mx-auto mt-10 mb-10 sm:mt-6 sm:mb-6 object-contain px-4 md:px-0 rtl:scale-100 ltr:scale-150 sm:ltr:scale-100"
        />

        <div className="max-w-[1300px] mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white">{t('common.loading')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-red-800 font-medium mb-2">{t('common.error')}</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button 
                onClick={loadProgrammes}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {programmes.length > 0 ? programmes
                .map((prog, idx) => {
                // Use detected currency for price selection
                let formattedPrice;
                let selectedPrice;
                
                // Select price based on detected currency
                switch (currency) {
                  case 'EGP':
                    selectedPrice = prog.priceEGP;
                    break;
                  case 'SAR':
                    selectedPrice = prog.priceSAR;
                    break;
                  case 'AED':
                    selectedPrice = prog.priceAED;
                    break;
                  case 'USD':
                    selectedPrice = prog.priceUSD;
                    break;
                  default:
                    // Default to EGP if currency not detected
                    selectedPrice = prog.priceEGP;
                    break;
                }
                
                if (selectedPrice && selectedPrice.amount !== undefined) {
                  if (selectedPrice.amount === 0) {
                    formattedPrice = i18n.language === 'ar' ? 'مجاني' : 'FREE';
                  } else {
                    // Use the CurrencyContext formatPrice function for consistent formatting
                    formattedPrice = formatPrice(selectedPrice.amount);
                  }
                } else {
                  formattedPrice = i18n.language === 'ar' ? 'السعر غير متوفر' : 'Price not available';
                }
                
                // Handle bilingual name data
                let programmeName;
                if (typeof prog.name === 'object' && prog.name !== null) {
                  programmeName = prog.name[i18n.language] || prog.name.en || prog.name.ar || 'Unnamed Programme';
                } else {
                  programmeName = prog.name || prog.title || 'Unnamed Programme';
                }
                
                return (
                  <Programme
                    key={prog.id || idx}
                    image={prog.image || prog.imageUrl}
                    name={programmeName}
                    price={formattedPrice}
                    programme={prog}
                  />
                );
              }) : (
                <div className="col-span-full text-center py-12">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
                    <div className="text-white/80 mb-4">
                      <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-white text-lg font-medium mb-2">
                      {i18n.language === 'ar' ? 'لا توجد برامج تدريبية متاحة' : 'No Training Programmes Available'}
                    </h3>
                    <p className="text-white/70 text-sm mb-4">
                      {i18n.language === 'ar' 
                        ? 'نعمل على إضافة برامج تدريبية جديدة قريباً' 
                        : 'We are working on adding new training programmes soon'
                      }
                    </p>
                    <button 
                      onClick={loadProgrammes}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm"
                    >
                      {i18n.language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TrainingProgramsPage;
