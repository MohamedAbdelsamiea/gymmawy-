import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Programme from "../../components/common/Programme";
import { useAsset } from "../../hooks/useAsset";
import { useLocation } from "../../hooks/useLocation";
import programmeService from "../../services/programmeService";

const TrainingProgramsPage = () => {
  const { t, i18n } = useTranslation("programmes"); // use the namespace
  const { country, currency, currencySymbol } = useLocation();
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
      setProgrammes(response.items || []);
    } catch (err) {
      console.log('API failed, using fallback data:', err.message);
      setError(err.message);
      // Fallback to hardcoded data if API fails
      setProgrammes(fallbackProgrammes);
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
          className="w-full h-auto w-auto min-w-xl rtl:max-w-xl ltr:max-w-4xl mx-auto brand-image mt-7 md:mt-14 object-contain"
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
          className="w-full h-auto rtl:max-w-xl ltr:max-w-5xl mx-auto md:mb-24 mb-8 object-contain"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {programmes.length > 0 ? programmes
                .map((prog, idx) => {
                // Use geolocation-based currency selection
                let formattedPrice;
                let selectedPrice;
                
                // Select price based on geolocation
                if (country === 'EG') {
                  // Egypt - use EGP
                  selectedPrice = prog.priceEGP;
                } else if (country === 'SA') {
                  // Saudi Arabia - use SAR
                  selectedPrice = prog.priceSAR;
                } else {
                  // Default to SAR for other countries
                  selectedPrice = prog.priceSAR;
                }
                
                if (selectedPrice && selectedPrice.amount !== undefined) {
                  if (selectedPrice.amount === 0) {
                    formattedPrice = i18n.language === 'ar' ? 'مجاني' : 'FREE';
                  } else {
                    // Use language-specific currency symbols
                    let displayCurrencySymbol;
                    if (i18n.language === 'ar') {
                      // Arabic: EGP = جم, SAR = رس
                      displayCurrencySymbol = selectedPrice.currency === 'SAR' ? 'رس' : 'جم';
                    } else {
                      // English: EGP = L.E, SAR = SAR
                      displayCurrencySymbol = selectedPrice.currency === 'SAR' ? 'SAR' : 'L.E';
                    }
                    formattedPrice = `${displayCurrencySymbol} ${selectedPrice.amount}`;
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
                    country={country}
                    currency={currency}
                  />
                );
              }) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-white">No programmes available</p>
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
