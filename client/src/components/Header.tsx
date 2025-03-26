import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthModals from './AuthModals';
import LanguageSwitcher from './LanguageSwitcher';
import CapitulreLogo from '../assets/logo';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRtl = currentLanguage === 'he';

  useEffect(() => {
    // Set the document direction based on the language
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <CapitulreLogo className="h-20 w-auto font-bold" />
        </div>

        <nav className="hidden md:block">
          <ul className={`flex ${isRtl ? 'space-x-reverse space-x-10' : 'space-x-10'}`}>
            <li>
              <a href="#" className="font-medium relative nav-link hover:text-primary transition-colors">
                {t('navigation.home')}
              </a>
            </li>
            <li>
              <a href="#features" className="font-medium relative nav-link hover:text-primary transition-colors">
                {t('navigation.features')}
              </a>
            </li>
            <li>
              <a href="#markets" className="font-medium relative nav-link hover:text-primary transition-colors">
                {t('navigation.markets')}
              </a>
            </li>
            <li>
              <a href="#contact" className="font-medium relative nav-link hover:text-primary transition-colors">
                {t('navigation.contact')}
              </a>
            </li>
          </ul>
        </nav>

        <div className={`flex ${isRtl ? 'space-x-reverse space-x-4' : 'space-x-4'} items-center`}>
          <LanguageSwitcher />
          
          <div className="hidden sm:flex items-center space-x-2">
            <AuthModals initialView="login" />
            <AuthModals initialView="signup" />
          </div>

          <button 
            className="md:hidden text-xl"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-black/95 w-full absolute top-full left-0 border-b border-white/10`}>
        <nav className="px-4 py-5">
          <ul className="space-y-4">
            <li>
              <a 
                href="#" 
                className="block py-2 font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.home')}
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className="block py-2 font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.features')}
              </a>
            </li>
            <li>
              <a 
                href="#markets" 
                className="block py-2 font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.markets')}
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className="block py-2 font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.contact')}
              </a>
            </li>
            <li className="flex flex-col gap-2 pt-4 border-t border-white/10">
              <AuthModals initialView="login" />
              <AuthModals initialView="signup" />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
