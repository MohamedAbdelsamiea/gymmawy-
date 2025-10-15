import { useTranslation } from 'react-i18next';
import { Youtube, Instagram } from 'lucide-react';

const Footer = ({ backgroundColor = 'bg-[#ebebeb]' }) => {
  const { t } = useTranslation('footer'); // using "footer" namespace

  return (
    <section className={`py-16 md:py-20 sm:pb-16 ${backgroundColor}`}>
      <div className="container mx-auto px-8 md:px-12 lg:px-20">
        {/* Bottom grid: Social + Company / Get in Touch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#190143]">{t('joinUs')}</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="
                  w-12 h-12 bg-[#190143] 
                  flex items-center justify-center 
                  rounded-xl transition-all duration-300
                  hover:bg-[#2a0a5a]
                "
              >
                <Youtube className="w-6 h-6 text-[#ebebeb] hover:text-white transition-colors duration-300" />
              </a>
              <a
                href="#"
                className="
                  w-12 h-12 bg-[#190143] 
                  flex items-center justify-center 
                  rounded-xl transition-all duration-300
                  hover:bg-[#2a0a5a]
                "
              >
                <Instagram className="w-6 h-6 text-[#ebebeb] hover:text-white transition-colors duration-300" />
              </a>
            </div>
          </div>

          {/* Company + Contact */}
          <div className="grid grid-cols-2 gap-8 text-[#190143]">
            <div>
              <h3 className="text-lg font-bold mb-2">{t('company')}</h3>
              <a href="#" className="block hover:text-[#2a0a5a] mb-2">{t('privacyPolicy')}</a>
              <a href="#" className="block hover:text-[#2a0a5a] mb-2">{t('termsConditions')}</a>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">{t('getInTouch')}</h3>
              <p className="mb-2">{t('address')}</p>
              <p className="mb-2 mt-3">{t('phone')}</p>
              <p className="mb-2">{t('email')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
