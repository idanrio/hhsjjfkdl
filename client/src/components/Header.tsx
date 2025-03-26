import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../App';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  return (
    <header className="fixed w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-primary text-2xl">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="ml-2 text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Capitalure
          </div>
        </div>

        <nav className="hidden md:block">
          <ul className="flex">
            <li className="ml-10 first:ml-0">
              <a href="#" className="font-medium relative nav-link hover:text-primary-light">
                {t('navigation.home')}
              </a>
            </li>
            <li className="ml-10">
              <a href="#features" className="font-medium relative nav-link hover:text-primary-light">
                {t('navigation.features')}
              </a>
            </li>
            <li className="ml-10">
              <a href="#markets" className="font-medium relative nav-link hover:text-primary-light">
                {t('navigation.markets')}
              </a>
            </li>
            <li className="ml-10">
              <a href="#contact" className="font-medium relative nav-link hover:text-primary-light">
                {t('navigation.contact')}
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex gap-4 items-center">
          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="bg-secondary p-2 rounded-full hover:bg-secondary/80 transition-all duration-300 text-sm"
            aria-label={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
          >
            {language === 'en' ? 'עב' : 'EN'}
          </button>
          
          <button className="hidden sm:block border-2 border-primary px-5 py-2 rounded font-semibold hover:bg-primary transition-all duration-300">
            {t('navigation.login')}
          </button>
          <button className="bg-primary px-5 py-2 rounded font-semibold hover:bg-primary-light transition-all duration-300">
            {t('navigation.signup')}
          </button>
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
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.home')}
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.features')}
              </a>
            </li>
            <li>
              <a 
                href="#markets" 
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.markets')}
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className="block py-2 font-medium hover:text-primary-light"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.contact')}
              </a>
            </li>
            <li className="pt-2 border-t border-white/10">
              <button 
                onClick={toggleLanguage}
                className="block py-2 font-medium hover:text-primary-light"
              >
                {language === 'en' ? 'עברית' : 'English'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
