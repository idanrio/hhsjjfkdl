import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isHebrew = currentLanguage === 'he' || currentLanguage.startsWith('he-');
  
  const toggleLanguage = () => {
    const newLanguage = isHebrew ? 'en' : 'he';
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="bg-secondary p-2 rounded-full hover:bg-secondary/80 transition-all duration-300 text-sm"
      aria-label={isHebrew ? 'Switch to English' : 'Switch to Hebrew'}
    >
      {isHebrew ? 'EN' : 'עב'}
    </button>
  );
};

export default LanguageSwitcher;