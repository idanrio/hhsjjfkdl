import React from 'react';
import { useTranslation } from 'react-i18next';
import CapitulreLogo from '../assets/logo';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'he';

  return (
    <footer className="bg-black/50 border-t border-white/10 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-6">
              <CapitulreLogo className="h-16" />
            </div>
            <p className={`text-white/60 mb-6 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-all duration-300">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-all duration-300">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary transition-all duration-300">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h4 className="font-bold text-lg mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-primary">{t('navigation.home')}</a></li>
              <li><a href="#features" className="text-white/60 hover:text-primary">{t('navigation.features')}</a></li>
              <li><a href="#markets" className="text-white/60 hover:text-primary">{t('navigation.markets')}</a></li>
              <li><a href="#contact" className="text-white/60 hover:text-primary">{t('navigation.contact')}</a></li>
            </ul>
          </div>

          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h4 className="font-bold text-lg mb-6">{t('footer.resources')}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/60 hover:text-primary">{t('footer.tradingGuides')}</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">{t('footer.marketAnalysis')}</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">{t('footer.educationBlog')}</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">{t('footer.glossary')}</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary">{t('footer.faqs')}</a></li>
            </ul>
          </div>

          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h4 className="font-bold text-lg mb-6">{t('footer.contactUs')}</h4>
            <ul className="space-y-3">
              <li className={`flex items-start ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                <i className={`fas fa-map-marker-alt mt-1 ${isRtl ? 'mr-0 ml-3' : 'mr-3'} text-primary`}></i>
                <span className="text-white/60">{t('footer.address')}</span>
              </li>
              <li className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <i className={`fas fa-envelope ${isRtl ? 'mr-0 ml-3' : 'mr-3'} text-primary`}></i>
                <span className="text-white/60">{t('footer.email')}</span>
              </li>
              <li className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <i className={`fas fa-phone-alt ${isRtl ? 'mr-0 ml-3' : 'mr-3'} text-primary`}></i>
                <span className="text-white/60">{t('footer.phone')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={`pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="text-white/50 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Capitulre. {t('footer.rights')}
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-white/50 hover:text-primary">{t('footer.privacy')}</a>
            <a href="#" className="text-white/50 hover:text-primary">{t('footer.terms')}</a>
            <a href="#" className="text-white/50 hover:text-primary">{t('footer.disclaimer')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
