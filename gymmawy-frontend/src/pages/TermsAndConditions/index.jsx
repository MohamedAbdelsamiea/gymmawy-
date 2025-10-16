import { useTranslation } from "react-i18next";
import { useLanguage } from "../../hooks/useLanguage";

const TermsAndConditions = () => {
  const { t } = useTranslation("terms");
  const { currentLanguage } = useLanguage();
  const isArabic = currentLanguage === 'ar';

  return (
    <section className="flex flex-col items-center md:py-20 py-12 bg-[#ebebeb]">
      {/* Terms Content */}
      <div className="w-full max-w-4xl px-6 sm:px-8 lg:px-0">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-8" dir={isArabic ? 'rtl' : 'ltr'} style={{ textAlign: isArabic ? 'right' : 'left' }}>
          
          {/* Title */}
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#190143] text-center">
              {t("title")}
            </h1>
          </div>
          
          {/* Program Delivery Policy */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#190143] mb-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {t("programDelivery.title")}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="text-base" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("programDelivery.deliveryTime")}</p>
              <p className="text-base" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("programDelivery.responseTime")}</p>
            </div>
          </div>

          {/* Subscription Refund Policy */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#190143] mb-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {t("refundPolicy.title")}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <div className="space-y-2">
                <p className="text-base font-semibold" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("refundPolicy.received.title")}</p>
                <p className={`text-base ${isArabic ? 'mr-4' : 'ml-4'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("refundPolicy.received.description")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("refundPolicy.notReceived.title")}</p>
                <p className={`text-base ${isArabic ? 'mr-4' : 'ml-4'}`} style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("refundPolicy.notReceived.description")}</p>
              </div>
            </div>
          </div>

          {/* Gymmawy Guarantee Policy */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#190143] mb-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {t("guaranteePolicy.title")}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="text-base" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("guaranteePolicy.description")}</p>
            </div>
          </div>

          {/* Client Conduct Policy */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#190143] mb-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {t("conductPolicy.title")}
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="text-base" style={{ textAlign: isArabic ? 'right' : 'left' }}>{t("conductPolicy.description")}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TermsAndConditions;
