import { useTranslation } from 'react-i18next';
import { Youtube, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = ({ backgroundColor = 'bg-[#ebebeb]' }) => {
  const { t } = useTranslation('footer'); // using "footer" namespace

  return (
    <section className={`pb-8 ${backgroundColor}`}>
      <div className="container mx-auto px-8 md:px-12 lg:px-20">
        {/* Bottom grid: Social + Company / Get in Touch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#190143]">{t('joinUs')}</h3>
            <div className="flex space-x-4">
              <a
                href="https://youtube.com/@yusufashraf19?si=CVUdFAwapV86bDm0"
                target="_blank"
                rel="noopener noreferrer"
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
                href="https://www.instagram.com/yusuf.ashraf19?igsh=MWw1YTkwaWlzZXRsMg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-12 h-12 bg-[#190143] 
                  flex items-center justify-center 
                  rounded-xl transition-all duration-300
                  hover:bg-[#2a0a5a]
                "
              >
                <Instagram className="w-6 h-6 text-[#ebebeb] hover:text-white transition-colors duration-300" />
              </a>
              <a
                href="https://www.tiktok.com/@yusuf_ashraf?_t=ZS-90ldtEs8KLE&_r=1"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-12 h-12 bg-[#190143] 
                  flex items-center justify-center 
                  rounded-xl transition-all duration-300
                  hover:bg-[#2a0a5a]
                "
              >
                {/* TikTok Icon - Simple SVG */}
                <svg 
                  className="w-6 h-6 text-[#ebebeb] hover:text-white transition-colors duration-300" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Company + Contact */}
          <div className="grid grid-cols-2 gap-8 text-[#190143]">
            <div>
              <h3 className="text-lg font-bold mb-2">{t('company')}</h3>
              <Link to="/privacy" className="block hover:text-[#2a0a5a] mb-2">{t('privacyPolicy')}</Link>
              <Link to="/terms" className="block hover:text-[#2a0a5a] mb-2">{t('termsConditions')}</Link>
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
