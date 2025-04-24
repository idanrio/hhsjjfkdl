import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Congratulations!": "Congratulations!",
      "You've received": "You've received",
      "FREE DEMO TRADING ACCOUNT": "FREE DEMO TRADING ACCOUNT",
      "Start practicing with professional tools and real-time market data without any financial risk.": "Start practicing with professional tools and real-time market data without any financial risk.",
      "Continue To Trading": "Continue To Trading"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false
    }
  });

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
    topTraders: 'Top Traders',
    backtest: 'Backtesting',
    admin: 'Admin'
  },
  logged_in_as: 'Logged in as',
  // Authentication
  auth: {
    loginTitle: 'Login to your account',
    signupTitle: 'Create an account',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Enter your username',
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
    loginError: 'Please enter both email and password',
    loginAsDemo: 'Login as Demo User',
    loginAsAdmin: 'Login as Admin'
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
  // Trading Environment
  Back: 'Back',
  'Trading Environment': 'Trading Environment',
  'Select Symbol': 'Select Symbol',
  'Save Analysis': 'Save Analysis',
  'Timeframe': 'Timeframe',
  'Volume': 'Volume',
  'Indicators': 'Indicators',
  'Trading': 'Trading',
  'Time Control': 'Time Control',
  'Create Position': 'Create Position',
  'Long': 'Long',
  'Short': 'Short',
  'Amount ($)': 'Amount ($)',
  'Leverage': 'Leverage',
  'Take Profit ($)': 'Take Profit ($)',
  'Stop Loss ($)': 'Stop Loss ($)',
  'Active Positions': 'Active Positions',
  'Entry': 'Entry',
  'Close': 'Close',
  'Show historical data only': 'Show historical data only',
  'Hide future data to practice backtesting without seeing the outcome': 'Hide future data to practice backtesting without seeing the outcome',
  'Chart Settings': 'Chart Settings',
  'Show Volume': 'Show Volume',
  'Chart Type': 'Chart Type',
  'Candle': 'Candle',
  'Line': 'Line',
  'Area': 'Area',
  'Cursor': 'Cursor',
  'Trend Line': 'Trend Line',
  'Rectangle': 'Rectangle',
  'Fibonacci': 'Fibonacci',
  'Add Position': 'Add Position',
  // AI Assistant
  aiAssistant: {
    title: 'AI Trading Assistant',
    description: 'Ask questions about trading, market analysis, or Wyckoff methodology.',
    placeholder: 'Ask a question about trading or market analysis...',
    emptyState: 'Ask your first question to get personalized trading insights.',
    you: 'You',
    assistant: 'Assistant',
    sources: 'Sources',
    error: 'Unable to process your question. Please try again.'
  },
  // Chart Analysis
  chartAnalysis: {
    title: 'Chart Pattern Analysis',
    description: 'Discover Wyckoff patterns in your chart data.',
    timeframe: 'Timeframe',
    timeframes: {
      '1m': '1 Minute',
      '5m': '5 Minutes',
      '15m': '15 Minutes',
      '1h': '1 Hour',
      '4h': '4 Hours',
      '1d': '1 Day'
    },
    analyze: 'Analyze Chart',
    analyzing: 'Analyzing...',
    attention: 'Attention',
    noData: 'No chart data available for analysis.',
    noPatterns: 'No significant patterns detected in this time range.',
    error: 'Failed to analyze the chart pattern.',
    analyzeFailed: 'Chart analysis failed. Please try again.',
    confidence: 'Confidence',
    recommendations: 'Recommendations'
  },
  // Personalized Advice
  personalizedAdvice: {
    title: 'Personalized Trading Advice',
    description: 'Custom insights based on your trading history and performance.',
    attention: 'Attention',
    error: 'Could not retrieve personalized advice.',
    fetchFailed: 'Failed to fetch personalized advice. Please try again.',
    disclaimer: 'This advice is generated based on your historical trading data and should be used as a reference only. Always conduct your own research before making trading decisions.'
  },
  // General
  error: 'Error',
  loading: 'Loading...',
  refresh: 'Refresh',
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
    topTraders: 'סוחרים מובילים',
    backtest: 'בקטסטינג',
    admin: 'ניהול'
  },
  logged_in_as: 'מחובר כ',
  // Authentication
  auth: {
    loginTitle: 'התחברות לחשבון שלך',
    signupTitle: 'יצירת חשבון חדש',
    nameLabel: 'שם מלא',
    namePlaceholder: 'הזן את שמך המלא',
    usernameLabel: 'שם משתמש',
    usernamePlaceholder: 'הזן את שם המשתמש שלך',
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
    loginError: 'נא להזין דואר אלקטרוני וסיסמה',
    loginAsDemo: 'כניסה כמשתמש הדגמה',
    loginAsAdmin: 'כניסה כמנהל'
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
  // Trading Environment
  Back: 'חזרה',
  'Trading Environment': 'סביבת מסחר',
  'Select Symbol': 'בחר סמל',
  'Save Analysis': 'שמור ניתוח',
  'Timeframe': 'מסגרת זמן',
  'Volume': 'נפח',
  'Indicators': 'אינדיקטורים',
  'Trading': 'מסחר',
  'Time Control': 'בקרת זמן',
  'Create Position': 'יצירת פוזיציה',
  'Long': 'לונג',
  'Short': 'שורט',
  'Amount ($)': 'סכום ($)',
  'Leverage': 'מינוף',
  'Take Profit ($)': 'לקיחת רווח ($)',
  'Stop Loss ($)': 'עצירת הפסד ($)',
  'Active Positions': 'פוזיציות פעילות',
  'Entry': 'כניסה',
  'Close': 'סגירה',
  'Show historical data only': 'הצג נתונים היסטוריים בלבד',
  'Hide future data to practice backtesting without seeing the outcome': 'הסתר נתונים עתידיים כדי לתרגל בקטסטינג ללא ראיית התוצאה',
  'Chart Settings': 'הגדרות גרף',
  'Show Volume': 'הצג נפח',
  'Chart Type': 'סוג גרף',
  'Candle': 'נר',
  'Line': 'קו',
  'Area': 'שטח',
  'Cursor': 'סמן',
  'Trend Line': 'קו מגמה',
  'Rectangle': 'מלבן',
  'Fibonacci': 'פיבונאצ\'י',
  'Add Position': 'הוסף פוזיציה',
  // AI Assistant
  aiAssistant: {
    title: 'עוזר מסחר חכם',
    description: 'שאל שאלות על מסחר, ניתוח שוק, או שיטת ווייקוף.',
    placeholder: 'שאל שאלה על מסחר או ניתוח שוק...',
    emptyState: 'שאל את השאלה הראשונה שלך לקבלת תובנות מסחר מותאמות אישית.',
    you: 'אתה',
    assistant: 'העוזר',
    sources: 'מקורות',
    error: 'לא ניתן לעבד את השאלה שלך. נא לנסות שוב.'
  },
  // Chart Analysis
  chartAnalysis: {
    title: 'ניתוח תבניות בגרף',
    description: 'גלה תבניות ווייקוף בנתוני הגרף שלך.',
    timeframe: 'מסגרת זמן',
    timeframes: {
      '1m': 'דקה',
      '5m': '5 דקות',
      '15m': '15 דקות',
      '1h': 'שעה',
      '4h': '4 שעות',
      '1d': 'יום'
    },
    analyze: 'נתח גרף',
    analyzing: 'מנתח...',
    attention: 'שים לב',
    noData: 'אין נתוני גרף זמינים לניתוח.',
    noPatterns: 'לא זוהו תבניות משמעותיות בטווח זמן זה.',
    error: 'ניתוח הגרף נכשל.',
    analyzeFailed: 'ניתוח הגרף נכשל. נא לנסות שוב.',
    confidence: 'מידת ביטחון',
    recommendations: 'המלצות'
  },
  // Personalized Advice
  personalizedAdvice: {
    title: 'ייעוץ מסחר מותאם אישית',
    description: 'תובנות מותאמות בהתבסס על היסטוריית המסחר והביצועים שלך.',
    attention: 'שים לב',
    error: 'לא ניתן לקבל ייעוץ מותאם אישית.',
    fetchFailed: 'לא ניתן לקבל ייעוץ מותאם אישית. נא לנסות שוב.',
    disclaimer: 'ייעוץ זה נוצר על בסיס נתוני המסחר ההיסטוריים שלך ויש להשתמש בו כמקור התייחסות בלבד. תמיד בצע את המחקר שלך לפני קבלת החלטות מסחר.'
  },
  // General
  error: 'שגיאה',
  loading: 'טוען...',
  refresh: 'רענן',
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