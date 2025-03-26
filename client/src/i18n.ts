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
    signup: 'Sign Up',
    topTraders: 'Top Traders'
  },
  // Authentication
  auth: {
    loginTitle: 'Login to your account',
    signupTitle: 'Create an account',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email address',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginButton: 'Login',
    signupButton: 'Sign up',
    noAccount: 'Don\'t have an account?',
    createAccount: 'Create account',
    haveAccount: 'Already have an account?',
    loginInstead: 'Login instead',
    termsPrefix: 'I agree to the',
    termsLink: 'Terms of Service',
    and: 'and',
    privacyLink: 'Privacy Policy',
    errorAllFields: 'Please fill in all fields',
    errorTerms: 'You must agree to the terms and privacy policy',
    thankYouTitle: 'Thank you for signing up!',
    thankYouMessage: 'Your account has been created successfully. You can now login with your credentials.',
    continueBrowsing: 'Continue browsing'
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
    title: 'Why Choose Capitulre',
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
  // Top Traders section
  topTraders: {
    title: 'Top Backtesting Traders',
    subtitle: 'Meet our most successful traders based on backtesting performance. Learn from their strategies and achievements.',
    winRate: 'Win Rate',
    profit: 'Total Profit',
    profitPct: 'Profit %',
    viewStrategy: 'View Strategy',
    viewAll: 'View All Top Traders',
    joinRanking: 'Join Our Ranking'
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
    email: 'support@capitulre.com',
    phone: '+1 (555) 123-4567',
    rights: 'All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    disclaimer: 'Disclaimer'
  }
};

// Hebrew translations - Improved grammatical correctness and fluency
const heTranslations = {
  // Header
  navigation: {
    home: 'דף הבית',
    features: 'יתרונות',
    markets: 'שווקים',
    contact: 'צור קשר',
    login: 'כניסה',
    signup: 'הרשמה',
    topTraders: 'סוחרים מובילים'
  },
  // Authentication
  auth: {
    loginTitle: 'התחברות לחשבון שלך',
    signupTitle: 'יצירת חשבון חדש',
    nameLabel: 'שם מלא',
    namePlaceholder: 'הזן את שמך המלא',
    emailLabel: 'דואר אלקטרוני',
    emailPlaceholder: 'הזן את כתובת הדואר האלקטרוני',
    passwordLabel: 'סיסמה',
    passwordPlaceholder: 'הזן את הסיסמה שלך',
    rememberMe: 'זכור אותי',
    forgotPassword: 'שכחת סיסמה?',
    loginButton: 'כניסה',
    signupButton: 'הרשמה',
    noAccount: 'אין לך חשבון?',
    createAccount: 'צור חשבון',
    haveAccount: 'כבר יש לך חשבון?',
    loginInstead: 'היכנס עכשיו',
    termsPrefix: 'אני מסכים/ה ל',
    termsLink: 'תנאי השימוש',
    and: 'ול',
    privacyLink: 'מדיניות הפרטיות',
    errorAllFields: 'נא למלא את כל השדות',
    errorTerms: 'יש להסכים לתנאי השימוש ולמדיניות הפרטיות',
    thankYouTitle: 'תודה על ההרשמה!',
    thankYouMessage: 'החשבון שלך נוצר בהצלחה. כעת ניתן להתחבר עם פרטי הכניסה שלך.',
    continueBrowsing: 'המשך לגלישה'
  },
  // Hero section
  hero: {
    title: 'שלוט בשווקים באמצעות הכשרת מסחר מתקדמת',
    description: 'נצל הזדמנויות בשוק עם פלטפורמת ההכשרה המקיפה שלנו. למד אסטרטגיות מסוחרים מומחים וקח שליטה על עתידך הפיננסי.',
    getStarted: 'התחל עכשיו',
    watchDemo: 'צפה בהדגמה'
  },
  // Features section
  features: {
    title: 'למה לבחור בקפיטולר',
    subtitle: 'הפלטפורמה שלנו מציעה משאבים וכלים ייחודיים שיסייעו לך להצליח בשווקים הפיננסיים המורכבים של ימינו.',
    expertLed: {
      title: 'הדרכה ממומחים מובילים',
      description: 'למד ממקצוענים בעלי שנות ניסיון בשווקים פיננסיים ובאסטרטגיות מסחר.'
    },
    analytics: {
      title: 'ניתוח מתקדם',
      description: 'גישה לכלי ניתוח טכני חזקים ולנתוני שוק בזמן אמת לתמיכה בהחלטות המסחר שלך.'
    },
    community: {
      title: 'קהילה תומכת',
      description: 'הצטרף לקהילה פעילה של סוחרים החולקים תובנות, אסטרטגיות ותמיכה במסע המסחר שלך.'
    },
    simulations: {
      title: 'סימולציות מסחר',
      description: 'התאמן במסחר בסביבה ללא סיכון עם טכנולוגיית סימולציית שוק מתקדמת.'
    },
    mobile: {
      title: 'גישה ממכשירים ניידים',
      description: 'גש לקורסים ולנתוני השוק מכל מכשיר באמצעות הפלטפורמה המותאמת שלנו.'
    },
    certification: {
      title: 'תוכניות הסמכה',
      description: 'קבל תעודות מוכרות בתעשייה המאשרות את הידע והמומחיות שלך במסחר.'
    }
  },
  // Markets section
  markets: {
    title: 'סקירת שוק',
    subtitle: 'הישאר מעודכן עם נתוני שוק בזמן אמת וניתוחים מקצועיים מהמומחים שלנו.',
    current: 'נוכחי',
    change: 'שינוי',
    high: 'שיא',
    fetchError: 'לא ניתן לטעון נתוני שוק. נא לנסות שוב מאוחר יותר.',
    analysis: {
      title: 'ניתוח שוק שבועי',
      paragraph1: 'מדד S&P 500 ממשיך במגמה העולה שלו, בהובלת ביצועים חזקים במניות הטכנולוגיה ואינדיקטורים כלכליים חיוביים. אווירת השוק נותרת אופטימית למרות החששות מאינפלציה.',
      paragraph2: 'הניתוח שלנו מצביע על פוטנציאל לשלב התבססות לפני המשך העלייה. סוחרים צריכים לעקוב אחר רמות התנגדות מרכזיות באזור 4,200 ולשמור על אסטרטגיות ניהול סיכונים מתאימות.',
      readMore: 'קרא ניתוח מלא'
    }
  },
  // CTA section
  cta: {
    title: 'התחל את מסע המסחר שלך היום',
    description: 'הצטרף לאלפי סוחרים ששינו את גישתם לשווקים עם פלטפורמת ההכשרה המקיפה שלנו. הירשם עכשיו לקבלת קורסי מתחילים בחינם.',
    students: 'תלמידים פעילים',
    videos: 'שיעורי וידאו',
    rating: 'דירוג ממוצע',
    form: {
      title: 'צור חשבון חינמי',
      fullName: 'שם מלא',
      fullNamePlaceholder: 'ישראל ישראלי',
      email: 'דואר אלקטרוני',
      emailPlaceholder: 'israel@example.com',
      password: 'סיסמה',
      passwordPlaceholder: '••••••••',
      terms: 'אני מסכים/ה ל',
      termsLink: 'תנאי השירות',
      and: 'ול',
      privacyLink: 'מדיניות הפרטיות',
      submit: 'התחל עכשיו',
      alreadyAccount: 'כבר יש לך חשבון?',
      signIn: 'היכנס'
    }
  },
  // Backtesting system
  backtest: {
    launchSystem: 'כניסה למערכת הבקטסטינג',
    loginTitle: 'כניסה למערכת הבקטסטינג',
    emailLabel: 'דואר אלקטרוני',
    emailPlaceholder: 'הזן את כתובת הדואר האלקטרוני',
    passwordLabel: 'סיסמה',
    passwordPlaceholder: 'הזן את הסיסמה שלך',
    loginButton: 'כניסה',
    cancel: 'ביטול',
    loginError: 'נא להזין דואר אלקטרוני וסיסמה'
  },
  // Top Traders section
  topTraders: {
    title: 'סוחרים מובילים במערכת הבקטסטינג',
    subtitle: 'הכירו את הסוחרים המצליחים ביותר שלנו על בסיס ביצועי בקטסטינג. למדו מהאסטרטגיות וההישגים שלהם.',
    winRate: 'אחוז הצלחה',
    profit: 'רווח כולל',
    profitPct: 'אחוז רווח',
    viewStrategy: 'צפייה באסטרטגיה',
    viewAll: 'צפייה בכל הסוחרים המובילים',
    joinRanking: 'הצטרף לדירוג שלנו'
  },
  // Footer
  footer: {
    description: 'הכשרת מסחר מתקדמת לסוחרים שאפתניים ומנוסים. למד, התאמן ושלוט בשווקים.',
    quickLinks: 'קישורים מהירים',
    resources: 'משאבים',
    tradingGuides: 'מדריכי מסחר',
    marketAnalysis: 'ניתוח שוק',
    educationBlog: 'בלוג לימודי',
    glossary: 'מילון מונחים',
    faqs: 'שאלות נפוצות',
    contactUs: 'צור קשר',
    address: 'רחוב המסחר 123, המרכז הפיננסי, תל אביב 67023',
    email: 'support@capitulre.com',
    phone: '+972 (55) 123-4567',
    rights: 'כל הזכויות שמורות.',
    privacy: 'מדיניות פרטיות',
    terms: 'תנאי שימוש',
    disclaimer: 'הצהרת אחריות'
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