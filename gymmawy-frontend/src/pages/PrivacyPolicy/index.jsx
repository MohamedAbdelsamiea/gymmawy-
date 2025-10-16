import { useTranslation } from "react-i18next";
import { useLanguage } from "../../hooks/useLanguage";

const PrivacyPolicy = () => {
  const { t } = useTranslation("privacy");
  const { currentLanguage } = useLanguage();
  const isArabic = currentLanguage === 'ar';

  return (
    <section className="flex flex-col items-center md:py-20 py-12 bg-[#ebebeb]">
      {/* Privacy Content */}
      <div className="w-full max-w-4xl px-6 sm:px-8 lg:px-0">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-8" dir={isArabic ? 'rtl' : 'ltr'} style={{ textAlign: isArabic ? 'right' : 'left' }}>
          
          {/* Title */}
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#190143] text-center">
              {t("title")}
            </h1>
          </div>
          
          {/* Information Collection */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#190143] mb-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {t("informationCollection.title")}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="text-base" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("informationCollection.description")}</p>
            </div>
          </div>

          {/* Data Storage */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#190143] mb-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {t("dataStorage.title")}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="text-base" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("dataStorage.description")}</p>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#190143] mb-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {t("socialMediaSharing.title")}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="text-base" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("socialMediaSharing.description")}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
