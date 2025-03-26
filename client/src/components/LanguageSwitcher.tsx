import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const toggleLanguage = () => {
    // Toggle between English and Hebrew
    const newLanguage = currentLanguage === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLanguage);
    // Set the HTML dir attribute for proper RTL/LTR rendering
    document.documentElement.dir = newLanguage === 'he' ? 'rtl' : 'ltr';
    // Store the language preference in localStorage
    localStorage.setItem('i18nextLng', newLanguage);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center text-sm font-medium hover:text-primary transition-colors"
      aria-label={currentLanguage === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
    >
      <Globe size={16} className="mr-1" />
      {currentLanguage === 'en' ? 'עברית' : 'English'}
    </button>
  );
};

export default LanguageSwitcher;