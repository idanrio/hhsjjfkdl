import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isHebrew = currentLanguage === 'he' || currentLanguage.startsWith('he-');
  
  useEffect(() => {
    // Force HTML dir attribute update when language changes
    document.documentElement.dir = isHebrew ? 'rtl' : 'ltr';
    document.documentElement.lang = isHebrew ? 'he' : 'en';
  }, [isHebrew]);
  
  const toggleLanguage = () => {
    const newLanguage = isHebrew ? 'en' : 'he';
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
    
    // Force page refresh to apply RTL/LTR styles properly
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="bg-primary p-2 rounded-full hover:bg-primary/80 transition-all duration-300 text-sm font-bold"
      aria-label={isHebrew ? 'Switch to English' : 'Switch to Hebrew'}
    >
      {isHebrew ? 'EN' : 'עב'}
    </button>
  );
};

export default LanguageSwitcher;