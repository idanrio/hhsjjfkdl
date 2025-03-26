import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  // Header
  navigation: {
    home: 'Home',
    features: 'Features',
    markets: 'Markets',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign Up'
  },
  // Hero section
  hero: {
    title: 'Master the Markets with Advanced Trading Education',
    description: 'Capitalize on market opportunities with our comprehensive trading education platform. Learn strategies from expert traders and take control of your financial future.',
    getStarted: 'Get Started',
    watchDemo: 'Watch Demo'
  },
  // Features section
  features: {
    title: 'Why Choose Capitalure',
    subtitle: 'Our platform offers unparalleled resources and tools to help you succeed in today\'s complex financial markets.',
    expertLed: {
      title: 'Expert-Led Education',
      description: 'Learn from industry professionals with years of experience in financial markets and trading strategies.'
    },
    analytics: {
      title: 'Advanced Analytics',
      description: 'Access powerful technical analysis tools and real-time market data to inform your trading decisions.'
    },
    community: {
      title: 'Community Support',
      description: 'Join a thriving community of traders sharing insights, strategies, and support on your trading journey.'
    },
    simulations: {
      title: 'Trading Simulations',
      description: 'Practice trading in a risk-free environment with our advanced market simulation technology.'
    },
    mobile: {
      title: 'Mobile Access',
      description: 'Access your courses and market data on any device with our fully responsive platform.'
    },
    certification: {
      title: 'Certification Programs',
      description: 'Earn industry-recognized certifications to validate your trading knowledge and expertise.'
    }
  },
  // Markets section
  markets: {
    title: 'Market Overview',
    subtitle: 'Stay informed with real-time market data and expert analysis from our trading professionals.',
    current: 'Current',
    change: 'Change',
    high: 'High',
    fetchError: 'Unable to fetch market data. Please try again later.',
    analysis: {
      title: 'Weekly Market Analysis',
      paragraph1: 'The S&P 500 continues its upward trend, driven by strong performance in technology stocks and positive economic indicators. Market sentiment remains optimistic despite concerns about inflation.',
      paragraph2: 'Our analysis suggests a potential consolidation phase before the next leg up. Traders should watch key resistance levels around 4,200 and maintain appropriate risk management strategies.',
      readMore: 'Read Full Analysis'
    }
  },
  // CTA section
  cta: {
    title: 'Start Your Trading Journey Today',
    description: 'Join thousands of traders who have transformed their approach to the markets with our comprehensive education platform. Sign up now to access free starter courses.',
    students: 'Active Students',
    videos: 'Video Lessons',
    rating: 'Average Rating',
    form: {
      title: 'Create Your Free Account',
      fullName: 'Full Name',
      fullNamePlaceholder: 'John Doe',
      email: 'Email Address',
      emailPlaceholder: 'john@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      terms: 'I agree to the',
      termsLink: 'Terms of Service',
      and: 'and',
      privacyLink: 'Privacy Policy',
      submit: 'Get Started Now',
      alreadyAccount: 'Already have an account?',
      signIn: 'Sign in'
    }
  },
  // Backtesting system
  backtest: {
    launchSystem: 'Launch Backtesting System',
    loginTitle: 'Login to Backtesting System',
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    loginButton: 'Login',
    cancel: 'Cancel',
    loginError: 'Please enter both email and password'
  },
  // Footer
  footer: {
    description: 'Advanced trading education for aspiring and experienced traders. Learn, practice, and master the markets.',
    quickLinks: 'Quick Links',
    resources: 'Resources',
    tradingGuides: 'Trading Guides',
    marketAnalysis: 'Market Analysis',
    educationBlog: 'Education Blog',
    glossary: 'Glossary',
    faqs: 'FAQs',
    contactUs: 'Contact Us',
    address: '123 Trading Street, Financial District, NY 10004',
    email: 'support@capitalure.com',
    phone: '+1 (555) 123-4567',
    rights: 'All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    disclaimer: 'Disclaimer'
  }
};

// Hebrew translations
const heTranslations = {
  // Header
  navigation: {
    home: 'דף הבית',
    features: 'תכונות',
    markets: 'שווקים',
    contact: 'צור קשר',
    login: 'התחברות',
    signup: 'הרשמה'
  },
  // Hero section
  hero: {
    title: 'שלוט בשווקים עם חינוך מסחר מתקדם',
    description: 'נצל הזדמנויות שוק עם פלטפורמת החינוך המקיפה שלנו למסחר. למד אסטרטגיות מסוחרים מומחים וקח שליטה על עתידך הפיננסי.',
    getStarted: 'התחל עכשיו',
    watchDemo: 'צפה בהדגמה'
  },
  // Features section
  features: {
    title: 'למה לבחור בקפיטלור',
    subtitle: 'הפלטפורמה שלנו מציעה משאבים וכלים ייחודיים שיעזרו לך להצליח בשווקים הפיננסיים המורכבים של היום.',
    expertLed: {
      title: 'לימוד מובל ע"י מומחים',
      description: 'למד ממקצוענים בתעשייה עם שנים של ניסיון בשווקים פיננסיים ואסטרטגיות מסחר.'
    },
    analytics: {
      title: 'אנליטיקה מתקדמת',
      description: 'גישה לכלי ניתוח טכני חזקים ונתוני שוק בזמן אמת כדי לתמוך בהחלטות המסחר שלך.'
    },
    community: {
      title: 'תמיכת קהילה',
      description: 'הצטרף לקהילה משגשגת של סוחרים החולקים תובנות, אסטרטגיות ותמיכה במסע המסחר שלך.'
    },
    simulations: {
      title: 'סימולציות מסחר',
      description: 'התאמן במסחר בסביבה נטולת סיכון עם טכנולוגיית סימולציית השוק המתקדמת שלנו.'
    },
    mobile: {
      title: 'גישה מהנייד',
      description: 'גש לקורסים ולנתוני השוק שלך בכל מכשיר עם הפלטפורמה המגיבה שלנו.'
    },
    certification: {
      title: 'תוכניות הסמכה',
      description: 'קבל תעודות מוכרות בתעשייה כדי לתקף את הידע והמומחיות שלך במסחר.'
    }
  },
  // Markets section
  markets: {
    title: 'סקירת שוק',
    subtitle: 'הישאר מעודכן עם נתוני שוק בזמן אמת וניתוחים מקצועיים מהמומחים שלנו.',
    current: 'נוכחי',
    change: 'שינוי',
    high: 'גבוה',
    fetchError: 'לא ניתן לטעון נתוני שוק. אנא נסה שוב מאוחר יותר.',
    analysis: {
      title: 'ניתוח שוק שבועי',
      paragraph1: 'מדד S&P 500 ממשיך במגמה העולה שלו, בהובלת ביצועים חזקים במניות הטכנולוגיה ואינדיקטורים כלכליים חיוביים. הלך הרוח בשוק נשאר אופטימי למרות החששות מאינפלציה.',
      paragraph2: 'הניתוח שלנו מצביע על פוטנציאל לשלב של התבססות לפני הרגל הבאה למעלה. סוחרים צריכים לעקוב אחר רמות התנגדות מפתח סביב 4,200 ולשמור על אסטרטגיות ניהול סיכונים מתאימות.',
      readMore: 'קרא ניתוח מלא'
    }
  },
  // CTA section
  cta: {
    title: 'התחל את מסע המסחר שלך היום',
    description: 'הצטרף לאלפי סוחרים ששינו את הגישה שלהם לשווקים עם פלטפורמת החינוך המקיפה שלנו. הירשם עכשיו כדי לגשת לקורסי מתחילים בחינם.',
    students: 'תלמידים פעילים',
    videos: 'שיעורי וידאו',
    rating: 'דירוג ממוצע',
    form: {
      title: 'צור חשבון חינמי',
      fullName: 'שם מלא',
      fullNamePlaceholder: 'ישראל ישראלי',
      email: 'כתובת אימייל',
      emailPlaceholder: 'israel@example.com',
      password: 'סיסמה',
      passwordPlaceholder: '••••••••',
      terms: 'אני מסכים/ה ל',
      termsLink: 'תנאי השירות',
      and: 'ו',
      privacyLink: 'מדיניות פרטיות',
      submit: 'התחל עכשיו',
      alreadyAccount: 'כבר יש לך חשבון?',
      signIn: 'התחבר'
    }
  },
  // Backtesting system
  backtest: {
    launchSystem: 'הפעל מערכת בדיקה',
    loginTitle: 'התחברות למערכת הבדיקה',
    emailLabel: 'כתובת אימייל',
    emailPlaceholder: 'הכנס את האימייל שלך',
    passwordLabel: 'סיסמה',
    passwordPlaceholder: 'הכנס את הסיסמה שלך',
    loginButton: 'התחבר',
    cancel: 'ביטול',
    loginError: 'אנא הכנס את האימייל והסיסמה'
  },
  // Footer
  footer: {
    description: 'חינוך מסחר מתקדם לסוחרים שאפתניים ומנוסים. למד, התאמן, ושלוט בשווקים.',
    quickLinks: 'קישורים מהירים',
    resources: 'משאבים',
    tradingGuides: 'מדריכי מסחר',
    marketAnalysis: 'ניתוח שוק',
    educationBlog: 'בלוג חינוכי',
    glossary: 'מילון מונחים',
    faqs: 'שאלות נפוצות',
    contactUs: 'צור קשר',
    address: 'רחוב המסחר 123, רובע פיננסי, ת"א 67023',
    email: 'support@capitalure.com',
    phone: '+972 (55) 123-4567',
    rights: 'כל הזכויות שמורות.',
    privacy: 'מדיניות פרטיות',
    terms: 'תנאי שימוש',
    disclaimer: 'כתב ויתור'
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      he: {
        translation: heTranslations
      }
    },
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;